// @ts-nocheck
// This is the main app shell only (ErrorBoundary, the Plansparency component,
// its props interface, and the default export). Phase 6 (Sept 2026) split the
// rest of the former ~2,500-line monolith out into smaller files:
//   lib/format.ts                       fmtRounded, fmtDollars, fmtShortAmt, fmtPctVal
//   lib/client/api.ts                   uploadFile, callClaude
//   components/plansparency/theme.ts    C, F, STAGE, btnBase
//   components/plansparency/ui.tsx      Md, Fm, LangToggle, Logo, Shield, Modal, StatChip, DonutChart
//   components/plansparency/nav.tsx     TabBar, PlanGuideTabBar, AppHeader
//   components/plansparency/KeyTermsPanel.tsx
//   components/plansparency/InvestmentsPanel.tsx   FundRow, DisclosureCallout, CATEGORY_ORDER, RISK_MAP, FUND_DISCLAIMER, InvestmentsPanel
//   components/plansparency/PlanOverview.tsx, PlanGlance.tsx, AnswerBody.tsx, useStickyPanel.ts
//   components/plansparency/CalcPanel.tsx
//   components/plansparency/StatementDashboard.tsx  SuggestionBox, StatementDashboard
// SectionIcon, PageBackground, TrustRow, and MiniBar were deleted as unused.
//
// DELIBERATE, DOCUMENTED EXCEPTION: this file still opts out of TypeScript
// checking. The lib/ files and theme.ts above are fully typed; the UI files
// keep @ts-nocheck for now. Typing happens file by file in a later phase.
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { parsePlanData, stripPlanData, normalizePlanData } from '@/lib/plan/plandata';
import { parseStmtData, stripStmtData } from '@/lib/plan/stmtdata';
import { endSessionFiles, INACTIVITY_LIMIT_MS } from '@/lib/client/session';
import { i18n } from '@/lib/i18n';
import { uploadFile, callClaude } from '@/lib/client/api';
import { C, F, STAGE, btnBase } from '@/components/plansparency/theme';
import { Md, Modal, LangToggle, Logo, Shield } from '@/components/plansparency/ui';
import { TabBar, PlanGuideTabBar, AppHeader } from '@/components/plansparency/nav';
import { KeyTermsPanel } from '@/components/plansparency/KeyTermsPanel';
import { InvestmentsPanel } from '@/components/plansparency/InvestmentsPanel';
import { PlanOverview } from '@/components/plansparency/PlanOverview';
import { CalcPanel } from '@/components/plansparency/CalcPanel';
import { StatementDashboard } from '@/components/plansparency/StatementDashboard';
import { Landing } from '@/components/plansparency/Landing';
import { getStockAnswer, questionLabel } from '@/lib/answers/stockAnswers';
import { getOverview } from '@/lib/plan/overview';
import { useStickyPanel } from '@/components/plansparency/useStickyPanel';
// Upload path: browser POSTs FormData directly to /api/ingest (Node.js route)


// ── Error Boundary ──
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e) { return { error: e }; }
  render() {
    if (this.state.error) return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 40, fontFamily: F.body }}>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: "32px 28px", maxWidth: 480, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ fontFamily: F.display, fontSize: 22, color: C.text, marginBottom: 12 }}>Something went wrong</h2>
          <p style={{ fontSize: 13, color: C.textMuted, marginBottom: 24, lineHeight: 1.6 }}>{this.state.error.message}</p>
          <button onClick={() => this.setState({ error: null })} style={{ ...btnBase, padding: "11px 24px", background: `linear-gradient(135deg,${C.accent},#B8863A)`, color: "#0F1621", fontSize: 14 }}>Try again</button>
        </div>
      </div>
    );
    return this.props.children;
  }
}

// ── Props interface ──
interface PlansparencyAppProps {
  mode?: 'version-a' | 'version-b';
  preloadedPlanText?: string;
  advisorLogo?: string;
  advisorFirmName?: string;
  planId?: string;
  advisorSlug?: string;
  // Participant mode — pre-load an existing plan without requiring upload
  initialPdfBase64?: string | null;
  initialPlanData?: Record<string, unknown> | null;
  initialMessages?: Array<{ role: string; content: string }>;
  initialStage?: string;
  // Upload flow on the start screen. Off for participants; on only for the advisor preview page.
  allowUpload?: boolean;
}

// ── Main App ──
function Plansparency({ mode = 'version-a', preloadedPlanText, advisorLogo, advisorFirmName, planId, advisorSlug, initialPdfBase64 = null, initialPlanData = null, initialMessages = [], initialStage = STAGE.CHOOSER, allowUpload = false }: PlansparencyAppProps = {}) {
  const [lang, setLang] = useState("en");
  const [stage, setStage] = useState(initialStage);
  const [docType, setDocType] = useState(null); // "spd" or "statement"
  const [fileName, setFileName] = useState("");
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [planData, setPlanData] = useState(initialPlanData);
  const [planGuideTab, setPlanGuideTab] = useState<"guide" | "investments">("guide");
  // Your plan tab: which topic is selected, which card is open, and the AI answers for cards
  // that have no written answer (cached per card and language for the session).
  const [topic, setTopic] = useState<'you' | 'employer' | 'access' | 'leave'>("employer");
  const [openCardId, setOpenCardId] = useState<string | null>("safeHarbor");
  const [cardAI, setCardAI] = useState<Record<string, { status: 'waiting' | 'loading' | 'done' | 'error'; text: string }>>({});
  const cardBusyRef = useRef(false);
  const planScrollRef = useRef(null);
  const planHeaderRef = useRef(null);
  const planLayoutRef = useRef(null);
  const [stmtData, setStmtData] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0); // 0-100 during upload phase
  const [uploadPhase, setUploadPhase] = useState<'uploading'|'analyzing'>('uploading');
  const [uploadDocIndex, setUploadDocIndex] = useState(0);   // which file is uploading (0-based)
  const [uploadDocCount, setUploadDocCount] = useState(1);   // total files being uploaded
  const [stagedFiles, setStagedFiles] = useState<File[]>([]); // files queued on landing before privacy
  const [streamingText, setStreamingText] = useState('');
  const [sessionEndReason, setSessionEndReason] = useState<'idle' | 'expired' | null>(null);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const pendingFilesRef = useRef<File[]>([]);
  const addDocRef = useRef(null);
  const abortRef = useRef(null);
  const fileIdsRef = useRef<string[]>([]);  // replaces fileIdRef; array of all uploaded file IDs
  const lastActivityRef = useRef(Date.now());

  const t = i18n[lang];
  const planSticky = useStickyPanel(planScrollRef, planHeaderRef, planLayoutRef, `${stage}-${activeTab}-${planGuideTab}`);

  const bumpActivity = () => { lastActivityRef.current = Date.now(); };

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => { if (stage === "chat" && !loading) inputRef.current?.focus(); }, [stage, loading]);

  // Best-effort file cleanup on tab/browser close — sendBeacon works during unload.
  useEffect(() => {
    const handlePageHide = () => { endSessionFiles(fileIdsRef.current, { beacon: true }); };
    window.addEventListener('pagehide', handlePageHide);
    return () => window.removeEventListener('pagehide', handlePageHide);
  }, []);

  // 30-minute inactivity: track activity, end the session if it goes quiet.
  useEffect(() => {
    window.addEventListener('click', bumpActivity);
    window.addEventListener('keydown', bumpActivity);
    return () => {
      window.removeEventListener('click', bumpActivity);
      window.removeEventListener('keydown', bumpActivity);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (fileIdsRef.current.length > 0 && Date.now() - lastActivityRef.current > INACTIVITY_LIMIT_MS) {
        clearSession();
        setSessionEndReason('idle');
      }
    }, 60000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Version-B: process preloaded plan text (skips upload) ──
  const processVersionB = useCallback(async (planText: string) => {
    setDocType('spd');
    setStage(STAGE.UPLOADING);
    try {
      const m1 = { role: 'user', content: t.firstMessage };
      const raw = await callClaude([m1], null, lang, null, () => {}, undefined);
      const pd = parsePlanData(raw);
      if (pd) setPlanData(pd);
      setMessages([m1, { role: 'assistant', content: stripPlanData(raw) }]);
      setStage(STAGE.APP);
    } catch (e: any) {
      if (e.name === 'AbortError') return;
      console.error('[processVersionB] Failed — status:', e.status, 'message:', e.message, e);
      setStage(STAGE.CHOOSER);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, t]);

  useEffect(() => {
    if (mode === 'version-b' && preloadedPlanText) {
      processVersionB(preloadedPlanText);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearSession = () => {
    endSessionFiles(fileIdsRef.current);
    setSessionEndReason(null);
    setFileName(""); setMessages([]); setInput(""); setLoading(false);
    setShowClearConfirm(false); setPlanData(null); setStmtData(null);
    setActiveTab("dashboard"); setPlanGuideTab("guide"); setDocType(null); setStreamingText(''); setUploadError("");
    pendingFilesRef.current = [];
    fileIdsRef.current = [];
    setStagedFiles([]);
    setStage(STAGE.CLEARED);
  };

  // Stage a file on the landing page (does not navigate away)
  const stageFile = (f: File) => {
    if (!f || f.type !== "application/pdf") { setUploadError(t.errorFormat); return; }
    if (f.size > 25 * 1024 * 1024) { setUploadError(lang === "es" ? "El archivo es demasiado grande. Máximo 25 MB." : "This PDF is too large. Please try a document under 25 MB."); return; }
    if (stagedFiles.length >= 3) { setUploadError(lang === "es" ? "Máximo 3 documentos." : "Maximum 3 documents allowed."); return; }
    setUploadError("");
    setStagedFiles(prev => [...prev.filter(s => s.name !== f.name), f]);
  };

  // Proceed to privacy screen with all staged files
  const initiateUpload = (f?: File) => {
    if (f) stageFile(f);
    // If files are already staged, go to privacy now (called by "Continue" button)
  };

  const proceedToPrivacy = () => {
    if (stagedFiles.length === 0) return;
    pendingFilesRef.current = stagedFiles;
    setStage(STAGE.PRIVACY);
  };

  // Shared upload processor — accepts an array of files
  const processUpload = useCallback(async (files: File[], resetState = false) => {
    if (!files?.length) return;
    bumpActivity();
    if (resetState) {
      setMessages([]); setPlanData(null); setStmtData(null);
    }
    const primaryFile = files[0];
    setUploadError(""); setFileName(primaryFile.name);
    setUploadProgress(0); setUploadPhase('uploading');
    setUploadDocIndex(0); setUploadDocCount(files.length);
    setStage(STAGE.UPLOADING);
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const uploadSignal = ctrl.signal;

      // ── Upload all files sequentially → collect fileIds ──────────────────
      const collectedIds: string[] = [];
      for (let i = 0; i < files.length; i++) {
        setUploadDocIndex(i);
        setFileName(files[i].name);
        setUploadProgress(0);
        const fid = await uploadFile(files[i], (pct) => setUploadProgress(pct), uploadSignal);
        collectedIds.push(fid);
      }

      // Captured from the local `ctrl`, not re-read from abortRef.current — a second
      // upload starting mid-analysis can no longer swap out this signal (Finding #4).
      const analyzeSignal = ctrl.signal;
      const oldIds = fileIdsRef.current.filter(id => !collectedIds.includes(id));
      if (oldIds.length) endSessionFiles(oldIds);
      fileIdsRef.current = collectedIds;
      setUploadPhase('analyzing');
      setStagedFiles([]);
      pendingFilesRef.current = [];

      if (docType === "statement") {
        const m1 = { role: "user", content: t.stmtFirstMessage };
        const raw = await callClaude([m1], null, lang, null, () => {}, analyzeSignal, collectedIds);
        const sd = parseStmtData(raw);
        if (sd) setStmtData(sd);
        setMessages([m1, { role: "assistant", content: stripStmtData(raw) }]);
        setStage(STAGE.STMT_DASHBOARD);
      } else {
        const m1 = { role: "user", content: t.firstMessage };
        const raw = await callClaude([m1], null, lang, null, () => {}, analyzeSignal, collectedIds);
        const pd = normalizePlanData(parsePlanData(raw));
        if (pd) setPlanData(pd);
        setMessages([m1, { role: "assistant", content: stripPlanData(raw), summary: true }]);
        if (!pd) {
          setUploadError(t.errorPlanData);
          setStage(STAGE.LANDING);
        } else {
          setStage(STAGE.APP);
        }
      }
      abortRef.current = null;
    } catch (e) {
      if ((e as any).name === "AbortError") { return; }
      console.error('[processUpload] Upload failed:', (e as any).message, e);
      pendingFilesRef.current = [];
      abortRef.current = null;

      let userMsg: string = t.errorRead;
      const status = (e as any).status;
      const msg = (e as any).message;
      if (status === 429) userMsg = t.errRateLimit;
      else if (status === 504) userMsg = t.errTimeout;
      else if (status === 413) userMsg = t.errUploadTooLarge;
      else if (!status && (e instanceof TypeError || /Failed to fetch|Load failed|NetworkError/i.test(msg || ""))) userMsg = t.errUploadNetwork;

      setUploadError(userMsg);
      setStage(resetState ? (docType === "statement" ? STAGE.STMT_DASHBOARD : STAGE.APP) : STAGE.LANDING);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, docType, t]);

  const proceedAfterConsent = () => { setPlanGuideTab("guide"); processUpload(pendingFilesRef.current, false); };

  // Complete fresh-start re-upload: wipe all state then open file picker.
  // addDocRef is used for in-session supplemental uploads (APP/stmtDashboard stages) — bypasses privacy screen.
  const startFreshUpload = () => {
    endSessionFiles(fileIdsRef.current);
    setMessages([]); setPlanData(null); setStmtData(null);
    setFileName(""); setInput(""); setLoading(false);
    setStreamingText(''); setStagedFiles([]); pendingFilesRef.current = []; fileIdsRef.current = [];
    setDocType(null); setStage(STAGE.CHOOSER);
  };

  // Jumps to the Plan Guide's "When Can You Start?" tile from anywhere (e.g. the calculator).
  const openEligibility = () => openCard("elig");

  // Added document on the plan screens (APP stage): the AI reads it for the fund list (and the
  // recordkeeper if it says so) and the funds fill Investments. No chat message is shown.
  const [fundsSource, setFundsSource] = useState("");
  const [fundsError, setFundsError] = useState(false);
  const supplementalUpload = useCallback(async (file: File) => {
    if (!file) return;
    bumpActivity();
    setUploadError("");
    setFundsError(false);
    setFileName(file.name);
    setUploadProgress(0);
    setUploadPhase('uploading');
    setUploadDocIndex(0);
    setUploadDocCount(1);
    setStage(STAGE.UPLOADING);
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const fid = await uploadFile(file, (pct) => setUploadProgress(pct), ctrl.signal);
      const updatedIds = [...fileIdsRef.current, fid];
      fileIdsRef.current = updatedIds;
      setUploadPhase('analyzing');
      // One source for the fund format: the same instructions the first read uses.
      const first = i18n.en.firstMessage;
      const fundsRules = first.slice(first.indexOf('- fundsData:'));
      const followUp = { role: "user" as const, summary: true, content:
        `I've added another document (${file.name}). Read it and respond with ONLY a hidden data block on its own line, with no summary and no other text, in exactly this format. This is the one case where a follow-up reply must include the PLANDATA block:\n<!--PLANDATA:{"recordkeeperName":"","recordkeeperUrl":"","fundsData":[]}-->\nInclude recordkeeperName and recordkeeperUrl only if this document gives them, otherwise leave them as empty strings. Fill fundsData using these rules:\n${fundsRules}` };
      const updatedMsgs = [...messages, followUp];
      const raw = await callClaude(updatedMsgs, null, lang, planData, () => {}, ctrl.signal, updatedIds, 'button');
      const found = normalizePlanData(parsePlanData(raw));
      const funds = found?.fundsData ?? [];
      if (funds.length > 0) {
        setPlanData(prev => ({
          ...(prev || {}),
          fundsData: funds,
          recordkeeperName: (prev && prev.recordkeeperName) || found?.recordkeeperName,
          recordkeeperUrl: (prev && prev.recordkeeperUrl) || found?.recordkeeperUrl,
        }));
        setFundsSource(file.name);
        // Keep the request in history (role/content only) so later answers know the funds.
        setMessages([...updatedMsgs, { role: "assistant", summary: true, content: `Funds found in ${file.name}: ${funds.map((f) => f.name).filter(Boolean).join(", ")}.` }]);
      } else {
        setFundsError(true);
      }
      setActiveTab("dashboard");
      setPlanGuideTab("investments");
      setStage(STAGE.APP);
      abortRef.current = null;
    } catch (e: any) {
      if (e.name === "AbortError") return;
      console.error('[supplementalUpload] failed:', e);
      let supUserMsg: string = t.errorRead;
      const supStatus = e.status;
      if (supStatus === 429) supUserMsg = t.errRateLimit;
      else if (supStatus === 504) supUserMsg = t.errTimeout;
      else if (supStatus === 413) supUserMsg = t.errUploadTooLarge;
      else if (!supStatus && (e instanceof TypeError || /Failed to fetch|Load failed|NetworkError/i.test(e.message || ""))) supUserMsg = t.errUploadNetwork;
      setUploadError(supUserMsg);
      setFundsError(true);
      setActiveTab("dashboard");
      setPlanGuideTab("investments");
      setStage(STAGE.APP);
      abortRef.current = null;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, lang, planData, t]);

  // ── Your plan cards ──
  const cardKey = (id) => `${id}:${lang}`;
  const topicOfCard = (id) => {
    const topics = getOverview(planData, lang).topics;
    return (Object.keys(topics).find((k) => topics[k].some((c) => c.id === id)) || "employer");
  };
  const scrollToCard = (id) => setTimeout(() => document.getElementById(`card-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  function openCard(id) {
    setActiveTab("dashboard");
    setPlanGuideTab("guide");
    setTopic(topicOfCard(id));
    setOpenCardId(id);
    scrollToCard(id);
  }
  const selectTopic = (k) => {
    setTopic(k);
    setOpenCardId(getOverview(planData, lang).topics[k][0]?.id ?? null);
  };
  const pickRow = (k, id) => { setTopic(k); setOpenCardId(id); scrollToCard(id); };
  const retryCard = (id) => setCardAI(prev => { const next = { ...prev }; delete next[cardKey(id)]; return next; });

  // Count opens of written answers (one log line with the card id, nothing else).
  useEffect(() => {
    if (stage !== STAGE.APP || activeTab !== "dashboard" || planGuideTab !== "guide" || !openCardId || !planData) return;
    if (!getStockAnswer(openCardId, planData, lang)) return;
    fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event: "stock_answer", id: openCardId }) }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openCardId, lang]);

  // No written answer for a card: the AI answers the card's question from the plan document.
  const startCardAI = async (id) => {
    const key = cardKey(id);
    cardBusyRef.current = true;
    setCardAI(prev => ({ ...prev, [key]: { status: 'loading', text: '' } }));
    const q = questionLabel(id, lang);
    const msgs = [...messages, { role: "user", content: q }];
    try {
      bumpActivity();
      const raw = await callClaude(msgs, null, lang, planData, chunk => setCardAI(prev => ({ ...prev, [key]: { status: 'loading', text: (prev[key]?.text || '') + chunk } })), undefined, fileIdsRef.current, 'button');
      const final = stripPlanData(raw);
      setCardAI(prev => ({ ...prev, [key]: { status: 'done', text: final } }));
      setMessages(prev => [...prev, { role: "user", content: q, summary: true }, { role: "assistant", content: final, summary: true }]);
    } catch (e) {
      if ((e as any).status === 410 || e.message === 'session_expired') { clearSession(); setSessionEndReason('expired'); }
      setCardAI(prev => ({ ...prev, [key]: { status: 'error', text: '' } }));
    } finally {
      cardBusyRef.current = false;
    }
  };
  useEffect(() => {
    if (stage !== STAGE.APP || activeTab !== "dashboard" || planGuideTab !== "guide" || !openCardId || !planData) return;
    if (getStockAnswer(openCardId, planData, lang)) return;
    const st = cardAI[cardKey(openCardId)];
    if (st && st.status !== 'waiting') return;
    if (cardBusyRef.current) {
      if (!st) setCardAI(prev => ({ ...prev, [cardKey(openCardId)]: { status: 'waiting', text: '' } }));
      return;
    }
    startCardAI(openCardId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openCardId, cardAI, lang, planData, stage, activeTab, planGuideTab]);

  // Supplemental upload: user already in APP/stmtDashboard — skip privacy, append fileId, ask Claude to review new doc
  const supplementalUploadStatement = useCallback(async (file: File) => {
    if (!file) return;
    bumpActivity();
    setUploadError("");
    setFileName(file.name);
    setUploadProgress(0);
    setUploadPhase('uploading');
    setUploadDocIndex(0);
    setUploadDocCount(1);
    setStage(STAGE.UPLOADING);
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const uploadSignal = ctrl.signal;
      const fid = await uploadFile(file, (pct) => setUploadProgress(pct), uploadSignal);
      const updatedIds = [...fileIdsRef.current, fid];
      fileIdsRef.current = updatedIds;
      setUploadPhase('analyzing');
      // Captured from the local `ctrl`, not re-read from abortRef.current (Finding #4).
      const analyzeSignal = ctrl.signal;
      const es = lang === "es";
      const followUp = { role: "user" as const, content: es
        ? `He añadido otro documento (${file.name}). Por favor revísalo y dime si contiene información adicional sobre el plan, especialmente opciones de inversión, comisiones u otras disposiciones no cubiertas en el documento anterior.`
        : `I've added another document (${file.name}). Please review it and let me know if it contains any additional plan information — especially investment options, fund lineup, fees, or plan provisions not covered in the original document.`
      };
      const updatedMsgs = [...messages, followUp];
      setMessages(updatedMsgs);
      setActiveTab("dashboard");
      setStage(STAGE.APP);
      setLoading(true);
      setStreamingText('');
      let reply = '';
      const raw = await callClaude(updatedMsgs, null, lang, planData, (chunk) => {
        reply += chunk;
        setStreamingText(reply);
      }, analyzeSignal, updatedIds);
      setMessages([...updatedMsgs, { role: "assistant", content: raw }]);
      setStreamingText('');
      setLoading(false);
      abortRef.current = null;
    } catch (e: any) {
      if (e.name === "AbortError") { setLoading(false); return; }
      console.error('[supplementalUpload] failed:', e);
      let supUserMsg: string = t.errorRead;
      const supStatus = e.status;
      if (supStatus === 429) supUserMsg = t.errRateLimit;
      else if (supStatus === 504) supUserMsg = t.errTimeout;
      else if (supStatus === 413) supUserMsg = t.errUploadTooLarge;
      else if (!supStatus && (e instanceof TypeError || /Failed to fetch|Load failed|NetworkError/i.test(e.message || ""))) supUserMsg = t.errUploadNetwork;
      setUploadError(supUserMsg);
      setStage(STAGE.APP);
      setLoading(false);
      abortRef.current = null;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, lang, planData, t]);

  const sendMessage = async (text, source = 'typed') => {
    if (!text.trim() || loading) return;
    bumpActivity();
    const um = { role: "user", content: text.trim() }; const nm = [...messages, um]; setMessages(nm); setInput(""); setLoading(true); setStreamingText('');
    if (stage === STAGE.STMT_DASHBOARD) setStage(STAGE.CHAT);
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    try {
      const raw = await callClaude(nm, null, lang, planData, chunk => setStreamingText(prev => prev + chunk), abortRef.current.signal, fileIdsRef.current, source);
      setStreamingText('');
      const cleaned = docType === "statement" ? stripStmtData(raw) : stripPlanData(raw);
      setMessages([...nm, { role: "assistant", content: cleaned }]);
      abortRef.current = null;
    } catch (e) {
      setStreamingText('');
      if (e.name === "AbortError") { abortRef.current = null; setLoading(false); return; }
      console.error('[sendMessage] Failed — status:', (e as any).status, 'message:', e.message, e);
      if ((e as any).status === 410 || e.message === 'session_expired') {
        abortRef.current = null;
        clearSession();
        setSessionEndReason('expired');
        return;
      }
      let replyMsg = t.errorReply;
      if ((e as any).status === 429) {
        replyMsg = "Too many requests. Please wait a minute and try again.";
      } else if (e.message === 'API key not configured') {
        replyMsg = "Configuration error. Please contact support.";
      }
      setMessages([...nm, { role: "assistant", content: replyMsg }]);
      abortRef.current = null;
    }
    setLoading(false);
  };

  const handleKeyDown = e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } };
  const handleDrop = e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files?.[0]) stageFile(e.dataTransfer.files[0]); };
  const lastMsg = messages[messages.length - 1];
  const showChips = (stage === STAGE.CHAT || stage === STAGE.APP) && !loading && lastMsg?.role === "assistant";

  // ── Privacy ──
  if (stage === "privacy") return <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: F.body, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
    <div style={{ maxWidth: 540, width: "100%" }}><div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: "32px 28px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}><div style={{ width: 38, height: 38, borderRadius: 12, background: C.accentDim, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid rgba(212,168,83,.2)` }}><Shield color={C.accent} sz={20} /></div>
        <h2 style={{ fontFamily: F.display, fontSize: 24, fontWeight: 600, margin: 0 }}>{t.privacyTitle}</h2></div>
      <p style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.6, marginBottom: 22 }}>{t.privacyIntro}</p>
      {t.privacyPoints.map(([title, body], i) => <div key={i} style={{ marginBottom: 14, paddingLeft: 14, borderLeft: `2px solid ${i === 1 ? C.warning : C.accent}` }}><p style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: "0 0 3px" }}>{title}</p><p style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.5, margin: 0 }}>{body}</p></div>)}
      <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(212,168,67,.08)", border: `1px solid rgba(212,168,67,.18)`, marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>📚</span>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: C.warning, margin: "0 0 4px" }}>
              {t.disclaimer}
            </p>
            <p style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.5, margin: 0 }}>
              {lang === "es"
                ? "Plansparency te ayuda a entender tu plan de jubilación. No proporciona asesoría financiera, fiscal ni de inversión personalizada. Consulta a un profesional calificado para decisiones financieras."
                : "Plansparency helps you understand your retirement plan. It does not provide personalized financial, tax, or investment advice. Consult a qualified professional for financial decisions."}
            </p>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
        <button onClick={() => { pendingFilesRef.current = []; setStage("landing"); }} style={{ ...btnBase, flex: 1, padding: "12px", fontSize: 14, background: "transparent", color: C.textMuted, border: `1px solid ${C.border}` }}>{t.privacyCancel}</button>
        <button onClick={proceedAfterConsent} style={{ ...btnBase, flex: 1, padding: "12px", fontSize: 14, background: `linear-gradient(135deg,${C.accent},#B8863A)`, color: "#0F1621" }}><span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Shield color="#0F1621" sz={14} />{t.privacyAgree}</span></button>
      </div></div></div></div>;

  // ── Start screens (chooser + landing) ──
  if (stage === "chooser" || stage === "landing") return <Landing allowUpload={allowUpload} t={t} lang={lang} setLang={setLang} stage={stage} setStage={setStage} docType={docType} setDocType={setDocType} stagedFiles={stagedFiles} setStagedFiles={setStagedFiles} fileInputRef={fileInputRef} stageFile={stageFile} handleDrop={handleDrop} dragOver={dragOver} setDragOver={setDragOver} uploadError={uploadError} proceedToPrivacy={proceedToPrivacy} />;

  // ── Cleared ──
  if (stage === "cleared") return <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: F.body, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40 }}>
    <div style={{ width: 56, height: 56, borderRadius: 16, background: C.accentDim, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}><Shield color={C.accent} sz={24} /></div>
    <h2 style={{ fontFamily: F.display, fontSize: 26, fontWeight: 600, margin: "0 0 8px" }}>{t.clearedTitle}</h2>
    <p style={{ color: C.textMuted, fontSize: 14, margin: "0 0 28px", textAlign: "center" }}>
      {sessionEndReason === "idle" ? t.calcSessionEndedIdle : sessionEndReason === "expired" ? t.errSessionExpired : t.clearedBody}
    </p>
    <button onClick={() => { setSessionEndReason(null); setStage("chooser"); }} style={{ ...btnBase, padding: "12px 28px", fontSize: 14, background: `linear-gradient(135deg,${C.accent},#B8863A)`, color: "#0F1621" }}>{t.clearedButton}</button></div>;

  // ── Uploading ──
  if (stage === "uploading") {
    const isMulti = uploadDocCount > 1;
    const es = lang === "es";
    return (
      <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: F.body, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40 }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: C.accentDim, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24, animation: "pulse 2s ease-in-out infinite", border: `1px solid rgba(212,168,83,.2)` }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
        </div>
        <h2 style={{ fontFamily: F.display, fontSize: 26, fontWeight: 600, margin: "0 0 6px", textAlign: "center" }}>{t.readingTitle}</h2>

        {/* Status label */}
        <p style={{ color: C.textMuted, fontSize: 13, margin: "0 0 16px", textAlign: "center", maxWidth: 320 }}>
          {uploadPhase === 'uploading' ? (
            isMulti
              ? <>{es ? `Enviando documento ${uploadDocIndex + 1} de ${uploadDocCount}` : `Uploading document ${uploadDocIndex + 1} of ${uploadDocCount}`}: <span style={{ color: C.accent }}>{fileName}</span></>
              : <>{es ? "Enviando" : "Uploading"} <span style={{ color: C.accent }}>{fileName}</span>…</>
          ) : (
            <>{es ? "Analizando tu plan" : "Analyzing your plan"}…</>
          )}
        </p>

        {/* Progress bar — always visible */}
        <div style={{ width: "100%", maxWidth: 300, marginBottom: 4 }}>
          <div style={{ width: "100%", height: 8, background: C.surfaceAlt, borderRadius: 4, overflow: "hidden", border: `1px solid ${C.borderLight}`, position: "relative" }}>
            {uploadPhase === 'uploading' ? (
              /* Determinate fill */
              <div style={{ height: "100%", width: `${uploadProgress}%`, background: `linear-gradient(90deg,${C.accent},#D4A853)`, borderRadius: 4, transition: "width .3s ease" }} />
            ) : (
              /* Indeterminate shimmer */
              <div style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg, transparent 0%, ${C.accent} 40%, #D4A853 60%, transparent 100%)`, animation: "shimmer 1.6s ease-in-out infinite" }} />
            )}
          </div>
        </div>

        {/* Percentage label */}
        {uploadPhase === 'uploading' && (
          <p style={{ color: C.textDim, fontSize: 11, margin: 0, fontVariantNumeric: "tabular-nums" }}>{uploadProgress}%</p>
        )}

        <style>{`
          @keyframes pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.06);opacity:.75}}
          @keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}
        `}</style>
      </div>
    );
  }

  // ── Dashboard (TOC) ──
  // ── SPD App (dashboard + calculator + key terms + chat) ──
  if (stage === STAGE.APP) {
    return (
      <div style={{ height: "100vh", background: C.bg, color: C.text, fontFamily: F.body, display: "flex", flexDirection: "column" }}>
        <input ref={addDocRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={e => { if (e.target.files?.[0]) supplementalUpload(e.target.files[0]); e.target.value = ""; }} />

        {showClearConfirm && <Modal>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: C.dangerDim, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.danger} strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
            </div>
            <h3 style={{ fontFamily: F.display, fontSize: 20, fontWeight: 600, margin: 0 }}>{t.clearConfirmTitle}</h3>
          </div>
          <p style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.6, marginBottom: 24 }}>{t.clearConfirmBody}</p>
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => setShowClearConfirm(false)} style={{ ...btnBase, flex: 1, padding: "11px", fontSize: 14, background: "transparent", color: C.textMuted, border: `1px solid ${C.border}` }}>{t.clearConfirmNo}</button>
            <button onClick={clearSession} style={{ ...btnBase, flex: 1, padding: "11px", fontSize: 14, background: C.danger, color: "#fff" }}>{t.clearConfirmYes}</button>
          </div>
        </Modal>}

        <AppHeader accentColor={C.accent} title={planData?.planName || fileName || "Your Plan"} lang={lang} setLang={setLang} loading={loading} t={t} advisorLogo={advisorLogo} advisorFirmName={advisorFirmName} />

        <TabBar activeTab={activeTab} setActiveTab={setActiveTab} t={t} />

        {activeTab === "dashboard" && (
          <>
            <PlanGuideTabBar
              activeTab={planGuideTab}
              setActiveTab={setPlanGuideTab}
              hasFunds={(planData?.fundsData || []).length > 0}
            />
            {planGuideTab === "guide" && (
              <PlanOverview
                planData={planData} lang={lang} review={planData?.review} topic={topic}
                onSelectTopic={selectTopic} openCardId={openCardId} onToggleCard={(id) => setOpenCardId(prev => prev === id ? null : id)} onPickRow={pickRow}
                getWritten={(id) => getStockAnswer(id, planData, lang)} getAI={(id) => cardAI[cardKey(id)] || null} onRetry={retryCard}
                onOpenCalculator={() => setActiveTab("calculator")} errorText={t.errorReply} footer={t.footerDisclaimer}
                scrollRef={planScrollRef} headerRef={planHeaderRef} layoutRef={planLayoutRef} sticky={planSticky}
              />
            )}
            {planGuideTab === "investments" && (
              <InvestmentsPanel fundsData={planData?.fundsData || []} lang={lang} onAddDocument={() => addDocRef.current?.click()} fundsSource={fundsSource} fundsError={fundsError} />
            )}
          </>
        )}
        {activeTab === "calculator" && <CalcPanel t={t} planData={planData} lang={lang} onOpenEligibility={openEligibility} />}
        {activeTab === "keyterms" && <KeyTermsPanel t={t} lang={lang} openStock={openCard} onOpenCalculator={() => setActiveTab("calculator")} />}

        {(
          <div style={{ flexShrink: 0, padding: "8px 16px", background: C.surfaceAlt, borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "flex-start", gap: 7 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.textDim} strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <p style={{ margin: 0, flex: 1, fontSize: 11, color: C.textDim, lineHeight: 1.6 }}>{t.planProvisionDisclaimer}</p>
            <button onClick={() => setShowClearConfirm(true)} style={{ ...btnBase, flexShrink: 0, minHeight: 36, padding: "3px 10px", fontSize: 11, background: "transparent", color: C.danger, border: `1px solid ${C.dangerDim}`, borderRadius: 8, opacity: .8 }}>{t.clearSession}</button>
          </div>
        )}

        <style>{`
          @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
          @keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}
          @keyframes blink{50%{opacity:0}}
          *{box-sizing:border-box;margin:0}
          ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}
          textarea::placeholder{color:${C.textDim}}
          input[type=range]{-webkit-appearance:none;appearance:none;background:#C8BFAE;border-radius:6px;outline:none;height:10px}
          input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,${C.accent},#B8863A);cursor:pointer;border:3px solid #FBF7F0;box-shadow:0 0 10px rgba(212,168,83,.4)}
          input[type=range]::-moz-range-thumb{width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,${C.accent},#B8863A);cursor:pointer;border:3px solid #FBF7F0;box-shadow:0 0 10px rgba(212,168,83,.4)}
          select{-webkit-appearance:none;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237A6B5D' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;padding-right:28px}
        `}</style>
      </div>
    );
  }

  // ── Statement Dashboard ──
  if (stage === "stmtDashboard") return <div style={{ height: "100vh", background: C.bg, color: C.text, fontFamily: F.body, display: "flex", flexDirection: "column" }}>
        <input ref={addDocRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={e => { if (e.target.files?.[0]) supplementalUploadStatement(e.target.files[0]); e.target.value = ""; }} />

    <AppHeader accentColor={C.green} title={stmtData?.planName || fileName || "Your Statement"} lang={lang} setLang={setLang} loading={loading} t={t} advisorLogo={advisorLogo} advisorFirmName={advisorFirmName} />

    <StatementDashboard
      t={t} stmtData={stmtData} lang={lang}
      onChat={() => setStage("chat")}
      onUploadAnother={startFreshUpload}
    />
  </div>;

  // ── Statement Chat ──
  return <div style={{ height: "100vh", background: C.bg, color: C.text, fontFamily: F.body, display: "flex", flexDirection: "column" }}>
        {showClearConfirm && <Modal><div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}><div style={{ width: 36, height: 36, borderRadius: 10, background: C.dangerDim, display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.danger} strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg></div>
      <h3 style={{ fontFamily: F.display, fontSize: 20, fontWeight: 600, margin: 0 }}>{t.clearConfirmTitle}</h3></div>
      <p style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.6, marginBottom: 24 }}>{t.clearConfirmBody}</p>
      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={() => setShowClearConfirm(false)} style={{ ...btnBase, flex: 1, padding: "11px", fontSize: 14, background: "transparent", color: C.textMuted, border: `1px solid ${C.border}` }}>{t.clearConfirmNo}</button>
        <button onClick={clearSession} style={{ ...btnBase, flex: 1, padding: "11px", fontSize: 14, background: C.danger, color: "#fff" }}>{t.clearConfirmYes}</button>
      </div></Modal>}

    <AppHeader
      accentColor={C.green}
      title={stmtData?.planName || fileName || "Your Statement"}
      onBack={() => setStage(STAGE.STMT_DASHBOARD)}
      backLabel={lang === "es" ? "Tu Estado" : "Your Statement"}
      lang={lang} setLang={setLang} loading={loading} t={t}
      advisorLogo={advisorLogo} advisorFirmName={advisorFirmName}
    />

    <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px 0", display: "flex", flexDirection: "column", gap: 12 }}>
      {messages.filter(m => m.role !== "user" || (!m.content.startsWith("I just uploaded") && !m.content.startsWith("Acabo de subir"))).map((msg, i) => (
        <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", animation: "fadeIn .3s" }}>
          <div style={{ maxWidth: "85%", padding: "12px 15px", borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background: msg.role === "user" ? C.userBubble : C.aiBubble, border: `1px solid ${msg.role === "user" ? "rgba(212,168,83,.1)" : C.border}`, fontSize: 14, lineHeight: 1.6 }}>
            {msg.role === "assistant" ? <Md text={msg.content} /> : msg.content}
          </div>
        </div>
      ))}
      {loading && (
        <div style={{ display: "flex" }}>
          {streamingText ? (
            <div style={{ maxWidth: "85%", padding: "12px 15px", borderRadius: "16px 16px 16px 4px", background: C.aiBubble, border: `1px solid ${C.border}`, fontSize: 14, lineHeight: 1.6 }}>
              <Md text={streamingText} />
              <span style={{ display: "inline-block", width: 2, height: "1em", background: C.accent, verticalAlign: "text-bottom", marginLeft: 2, animation: "blink 1s step-end infinite" }} />
            </div>
          ) : (
            <div style={{ padding: "12px 15px", borderRadius: "16px 16px 16px 4px", background: C.aiBubble, border: `1px solid ${C.border}`, display: "flex", gap: 6 }}>
              {[0, 1, 2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: C.accent, opacity: .5, animation: `bounce 1.2s ease-in-out ${i * .15}s infinite` }} />)}
            </div>
          )}
        </div>
      )}
      {showChips && <div style={{ display: "flex", gap: 7, flexWrap: "wrap", justifyContent: "center", padding: "4px 0 8px" }}>
        {t.quickAsks.map(q => <button key={q} onClick={() => sendMessage(q, "button")}
          style={{ padding: "7px 13px", borderRadius: 100, fontSize: 12, background: C.accentDim, color: C.accent, border: `1px solid rgba(212,168,83,.18)`, cursor: "pointer", fontFamily: F.body, transition: "all .15s", whiteSpace: "nowrap" }}
          onMouseEnter={e => e.currentTarget.style.background = C.accentGlow} onMouseLeave={e => e.currentTarget.style.background = C.accentDim}
        >{q}</button>)}</div>}
      <div ref={chatEndRef} />
    </div>

    <div style={{ padding: "10px 16px 12px", borderTop: `1px solid ${C.border}`, background: C.surface, flexShrink: 0 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "flex-end", background: C.bg, borderRadius: 14, padding: "4px 4px 4px 14px", border: `1px solid ${C.border}` }}>
        <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder={t.inputPlaceholder} rows={1}
          style={{ flex: 1, background: "none", border: "none", outline: "none", color: C.text, fontSize: 14, fontFamily: F.body, resize: "none", padding: "9px 0", lineHeight: 1.5, maxHeight: 100, minHeight: 18 }}
          onInput={e => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px"; }} />
        <button onClick={() => sendMessage(input)} disabled={!input.trim() || loading}
          style={{ width: 38, height: 38, borderRadius: 10, border: "none", background: input.trim() && !loading ? `linear-gradient(135deg,${C.accent},#B8863A)` : C.border, cursor: input.trim() && !loading ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s", flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={input.trim() && !loading ? "#0F1621" : C.textDim} strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
        </button>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
        <span style={{ fontSize: 10, color: C.textDim }}>{t.footerDisclaimer}</span>
        <button onClick={() => setShowClearConfirm(true)} style={{ ...btnBase, padding: "3px 10px", fontSize: 10, background: "transparent", color: C.danger, border: `1px solid ${C.dangerDim}`, borderRadius: 8, opacity: .7 }}
          onMouseEnter={e => e.currentTarget.style.opacity = "1"} onMouseLeave={e => e.currentTarget.style.opacity = ".7"}>{t.clearSession}</button>
      </div>
    </div>

    <style>{`
      @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      @keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}
      @keyframes blink{50%{opacity:0}}
      *{box-sizing:border-box;margin:0}
      ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}
      textarea::placeholder{color:${C.textDim}}
      input[type=range]{-webkit-appearance:none;appearance:none;background:#C8BFAE;border-radius:6px;outline:none;height:10px}
      input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,${C.accent},#B8863A);cursor:pointer;border:3px solid #FBF7F0;box-shadow:0 0 10px rgba(212,168,83,.4)}
      input[type=range]::-moz-range-thumb{width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,${C.accent},#B8863A);cursor:pointer;border:3px solid #FBF7F0;box-shadow:0 0 10px rgba(212,168,83,.4)}
      select{-webkit-appearance:none;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237A6B5D' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;padding-right:28px}
    `}</style>
  </div>;
}

export default function PlansparencyApp(props: PlansparencyAppProps) {
  return React.createElement(ErrorBoundary, null, React.createElement(Plansparency, props));
}
