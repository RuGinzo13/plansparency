// Browser only. Reads a plan document with AI and returns the plan details found in it.
// Used by the new-plan review and by "Upload additional plan doc".
//
// The uploaded file lives on Anthropic's side only while we read it. The caller must delete it
// (endSessionFiles([fileId])) when it is done. If reading fails here, we delete it before throwing.
import { parsePlanData, stripPlanData } from '@/lib/plan/plandata';
import { endSessionFiles } from '@/lib/client/session';
import { i18n } from '@/lib/i18n';

export type ReadPlanResult = { planData: any; initialSummary: string; fileId: string };

export async function readPlanDocument(file: File, onStatus: (text: string) => void): Promise<ReadPlanResult> {
  if (!file.type.includes('pdf')) throw new Error('Please upload a PDF file.');
  if (file.size > 25 * 1024 * 1024) throw new Error('File must be under 25 MB.');

  // Step 1 — upload PDF to Anthropic Files API via Node.js /api/ingest
  // (avoids sending large base64 through the 4 MB edge function body limit)
  onStatus('Uploading plan document…');
  const fd = new FormData();
  fd.append('file', file);
  const ingestRes = await fetch('/api/ingest', { method: 'POST', body: fd });
  if (!ingestRes.ok) { const d = await ingestRes.json().catch(() => ({})); throw new Error(d.error || `Upload error ${ingestRes.status}`); }
  const { fileId } = await ingestRes.json();

  try {
    // Step 2 — call /api/chat with fileId only (no PDF bytes in body)
    onStatus('Reading plan document…');
    const chatRes = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: i18n.en.firstMessage }], fileIds: [fileId], lang: 'en', planData: null }),
    });
    if (!chatRes.ok) { const d = await chatRes.json().catch(() => ({})); throw new Error(d.error || `Chat error ${chatRes.status}`); }
    const reader = chatRes.body?.getReader();
    if (!reader) throw new Error('No response stream from chat API');
    const decoder = new TextDecoder();
    let raw = '';
    while (true) { const { done, value } = await reader.read(); if (done) break; raw += decoder.decode(value, { stream: true }); }

    const planData = parsePlanData(raw);
    if (!planData) throw new Error('Could not extract plan data. Try a different copy of the document.');
    return { planData, initialSummary: stripPlanData(raw), fileId };
  } catch (e) {
    endSessionFiles([fileId]);
    throw e;
  }
}
