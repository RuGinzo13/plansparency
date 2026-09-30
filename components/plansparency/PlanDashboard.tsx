// @ts-nocheck
'use client';

import { useMemo } from 'react';
import { C, F } from './theme';

export function PlanDashboard({ t, planData, onSectionClick, onChat, onUploadAnother, lang, collapsedSections, setCollapsedSections }) {
  const pd = planData || {};
  const tiers = pd.matchTiers || [];
  const noMatch = pd.noMatch || tiers.length === 0;
  const matchDesc = noMatch ? null : tiers.map(tier => `${tier.pct}% on first ${tier.upTo}%`).join(" + ");
  const hasSafeHarbor = pd.safeHarbor?.type && pd.safeHarbor.type !== "none";
  const hasProfitSharing = pd.profitSharing?.available;
  // Claude may output either "hasRoth" or "rothAvailable" — check both, same question
  const planHasRoth = pd.hasRoth ?? pd.rothAvailable ?? false;

  const es = lang === "es";

  const planName = pd.planName || (es ? "Tu Plan 401(k)" : "Your 401(k) Plan");

  // Detect whether a field was actually found in the document vs just defaulted
  const rothKnown = pd.hasRoth != null || pd.rothAvailable != null;
  const freeMoney = hasSafeHarbor ? "Safe Harbor"
    : pd.noMatch === true ? (es ? "No hay" : "None")
    : matchDesc || "N/A";
  const freeMoneyColor = (hasSafeHarbor || matchDesc) ? C.green : C.textDim;
  const vestingValue = pd.vestingSchedule
    ? (pd.vestingSchedule.toLowerCase().includes("immediate") || pd.vestingSchedule.includes("100%")
        ? (es ? "Inmediato" : "Immediate")
        : (es ? "Gradual" : "Graded"))
    : "N/A";
  const rothValue = !rothKnown ? "N/A" : planHasRoth ? (es ? "Sí" : "Yes") : (es ? "No" : "No");
  const rothColor = !rothKnown ? C.textDim : planHasRoth ? C.green : C.textDim;
  const loansValue = pd.loanAvailable === true ? (es ? "Sí" : "Yes")
    : pd.loanAvailable === false ? (es ? "No" : "No")
    : "N/A";

  // Quick-glance stat chips shown in the hero — each is clickable to ask Claude for detail
  const quickStats = [
    {
      emoji: "💰", label: es ? "Dinero Gratis" : "Free Money", value: freeMoney, color: freeMoneyColor,
      prompt: es
        ? "Explícame en detalle el dinero gratis que ofrece este plan. Distingue entre safe harbor, match discrecional y profit sharing. ¿Cuánto aporta el empleador? ¿Hay condiciones? Usa un ejemplo con $50,000 de salario."
        : "Explain in detail the free money available in this plan. Distinguish between safe harbor, discretionary match, and profit sharing. How much does the employer contribute? Are there any conditions? Use a $50,000 salary example.",
    },
    {
      emoji: "⏳", label: "Vesting", value: vestingValue, color: C.accent,
      prompt: es
        ? "Explícame el calendario de vesting de este plan. ¿Qué contribuciones son inmediatamente 100% mías (como safe harbor)? ¿Cuáles siguen un calendario de vesting? ¿Qué pasa si me voy antes de estar totalmente vestido?"
        : "Explain the vesting schedule in this plan. Which contributions are immediately 100% mine (like safe harbor)? Which follow a vesting schedule? What happens if I leave before I'm fully vested?",
    },
    {
      emoji: "☀️", label: "Roth", value: rothValue, color: rothColor,
      prompt: es
        ? "Explícame las opciones Roth y pre-impuesto en este plan. ¿Cuál es la diferencia práctica? ¿Cuándo conviene elegir Roth? ¿Cuándo conviene pre-impuesto? ¿Qué ofrece exactamente este plan?"
        : "Explain the Roth and pre-tax options in this plan. What's the practical difference? When does Roth make more sense? When does pre-tax make more sense? What exactly does this plan offer?",
    },
    {
      emoji: "🏦", label: es ? "Préstamos" : "Loans", value: loansValue, color: pd.loanAvailable === true ? C.green : C.textDim,
      prompt: es
        ? "¿Puedo tomar un préstamo de mi 401(k)? Explícame las reglas: ¿cuánto puedo pedir, por cuánto tiempo, cómo funciona el repago, y qué riesgos hay si dejo el trabajo?"
        : "Can I take a loan from my 401(k)? Explain the rules: how much can I borrow, for how long, how does repayment work, and what are the risks if I leave my job?",
    },
  ];

  // All feature tiles
  const tiles = useMemo(() => {
    const list = [];

    if (hasSafeHarbor) list.push({
      id: "safeHarbor", emoji: "🎁",
      title: es ? "Dinero Gratis Garantizado" : "Guaranteed Free Money",
      status: pd.safeHarbor?.formula || (es ? "100% tuyo desde el día 1" : "100% yours from day one"),
      desc: es
        ? "Tu empleador pone dinero en tu cuenta sin importar si tú contribuyes."
        : "Your employer puts money in your account no matter what — you don't have to contribute to get it.",
      accent: C.green, bg: C.greenDim,
      prompt: es
        ? "Explícame la contribución safe harbor de este plan. ¿Cuánto contribuye el empleador? ¿Por qué es 100% inmediatamente investido? ¿Cómo es diferente del match discrecional y del profit sharing?"
        : "Explain the safe harbor contribution in this plan. How much does the employer contribute? Why is it 100% immediately vested? How is it different from the discretionary match and profit sharing?",
    });

    if (!noMatch) list.push({
      id: "match", emoji: "🤜🤛",
      title: es ? "Tu Jefe Te Iguala" : "Your Employer Matches You",
      status: matchDesc,
      desc: es
        ? "Por cada dólar que aportas, tu empleador añade más. ¡No dejes ese dinero gratis sobre la mesa!"
        : "For every dollar you put in, your employer adds more on top. Don't leave that free money behind!",
      accent: C.green, bg: C.greenDim,
      prompt: es
        ? "¿Cómo funciona el match discrecional del empleador? Dame un ejemplo con un salario de $50,000. ¿Cómo es diferente de la contribución safe harbor? ¿Aplica la provisión de último día del año?"
        : "How does the discretionary employer match work? Give me a dollar example using a $50,000 salary. How is it different from the safe harbor contribution? Does the last-day-of-year provision apply?",
    });

    if (hasProfitSharing) list.push({
      id: "profitSharing", emoji: "📈",
      title: es ? "Bonificación por Ganancias" : "Company Profit Bonus",
      status: pd.profitSharing?.formula || (es ? "El jefe decide cada año" : "Employer decides each year"),
      desc: es
        ? "Cuando la empresa va bien, puede compartir las ganancias contigo en tu cuenta."
        : "When the company does well, they may share the profits directly into your retirement account.",
      accent: C.accent, bg: C.accentDim,
      prompt: es
        ? "Explícame el profit sharing en este plan. ¿Es garantizado o discrecional? ¿Cómo es diferente del match y del safe harbor? ¿Tiene su propio calendario de vesting? ¿Aplica la provisión de último día del año?"
        : "Explain profit sharing in this plan. Is it guaranteed or discretionary? How is it different from the match and safe harbor? Does it have its own vesting schedule? Does the last-day-of-year provision apply?",
    });

    list.push({
      id: "vesting", emoji: "🔐",
      title: es ? "¿Cuándo Es Realmente Tuyo?" : "When Is It Really Yours?",
      status: pd.vestingSchedule || (es ? "Ver documento" : "See your document"),
      desc: es
        ? "El dinero del empleador se 'gana' con el tiempo. Si te vas pronto, podrías dejar parte atrás."
        : "Employer money becomes fully yours over time. Leave too soon and you might leave some behind.",
      accent: C.accent, bg: C.accentDim,
      prompt: es
        ? "Explícame el calendario de vesting. Distingue claramente: ¿qué contribuciones son inmediatamente investidas (como safe harbor) y cuáles siguen un calendario de vesting (como match discrecional y profit sharing)? ¿Qué pasa si me voy antes de estar totalmente investido?"
        : "Explain the vesting schedule. Clearly distinguish: which contributions are immediately vested (like safe harbor) and which follow a vesting schedule (like discretionary match and profit sharing)? What happens if I leave before I'm fully vested?",
    });

    {
      const me = pd.matchEligibility || {};
      const matchEligLine = me.requirement
        ? (es
            ? `El dinero del empleador empieza: ${me.requirement}${me.entryDates ? ` (entrada: ${me.entryDates})` : ""}`
            : `Employer money starts: ${me.requirement}${me.entryDates ? ` (entry: ${me.entryDates})` : ""}`)
        : me.immediateMatch === true
          ? (es ? "El dinero del empleador empieza de inmediato." : "Employer money starts right away.")
          : (es ? "Dinero del empleador: consulta tu documento del plan." : "Employer money: see your plan document.");

      list.push({
        id: "eligContrib", emoji: "🚪",
        title: es ? "¿Cuándo Puedes Empezar?" : "When Can You Start?",
        status: pd.contribEligibility?.requirement || (es ? "Ver documento" : "See your document"),
        desc: (pd.contribEligibility?.autoEnroll
          ? (es
              ? `Te inscribieron automáticamente al ${pd.contribEligibility.autoEnrollPct}%. Puedes cambiar esto.`
              : `You were auto-enrolled at ${pd.contribEligibility.autoEnrollPct}%. You can change this anytime.`)
          : (es
              ? "Hay requisitos de edad y tiempo de servicio antes de poder unirte."
              : "There are age and service requirements before you can join the plan.")
        ) + "\n" + matchEligLine,
        accent: C.accent, bg: C.accentDim,
        prompt: es
          ? "Explícame la elegibilidad para contribuir al plan. ¿Cuáles son los requisitos de edad y servicio? ¿Cuándo puedo empezar a aportar mi propio dinero?"
          : "Explain contribution eligibility for this plan. What are the age and service requirements? When can I start contributing my own money?",
      });
    }

    list.push({
      id: "roth", emoji: "☀️",
      title: es ? "¿Pagar Impuestos Ahora o Después?" : "Pay Taxes Now or Later?",
      status: planHasRoth ? (es ? "Roth disponible ✓" : "Roth available ✓") : (es ? "Solo pre-impuesto" : "Pre-tax only"),
      desc: es
        ? "Tradicional: pagas impuestos cuando retiras. Roth: pagas ahora, los retiros calificados después pueden ser libres de impuestos."
        : "Traditional: taxed when you take it out. Roth: taxed now, qualified withdrawals later can be tax-free.",
      accent: planHasRoth ? C.green : C.textDim,
      bg: planHasRoth ? C.greenDim : "rgba(154,136,120,.08)",
      prompt: es
        ? "Explícame las opciones Roth y pre-impuesto en este plan. ¿Cuál es la diferencia en términos simples?"
        : "Explain the Roth and pre-tax options in this plan. What's the difference in simple terms?",
    });

    list.push({
      id: "investments", emoji: "📊",
      title: es ? "¿Dónde Va Tu Dinero?" : "Where Does Your Money Go?",
      status: pd.investmentOptions || (es ? "Ver documento" : "See your document"),
      desc: es
        ? "Tú eliges entre las opciones de inversión disponibles. Tú decides cómo crecer tu dinero."
        : "You choose how your money is invested from the available funds — you're in control.",
      accent: C.green, bg: C.greenDim,
      prompt: es
        ? "¿Qué opciones de inversión están disponibles en este plan? Explícalas en términos simples."
        : "What investment options are available in this plan? Explain them in simple terms.",
    });

    list.push({
      id: "loans", emoji: "🏦",
      title: es ? "¿Puedes Pedir Prestado?" : "Can You Borrow From It?",
      status: pd.loanAvailable === true
        ? (es ? "Préstamos disponibles ✓" : "Loans available ✓")
        : pd.loanAvailable === false
          ? (es ? "No disponible" : "Not available")
          : (es ? "Ver documento" : "See your document"),
      desc: pd.loanAvailable === false
        ? (es ? "Este plan no ofrece préstamos del 401(k)." : "This plan does not offer 401(k) loans.")
        : (es ? "Puedes pedir prestado de TU propio dinero y devolvértelo a ti mismo con intereses." : "You can borrow from YOUR own savings and pay yourself back with interest."),
      accent: pd.loanAvailable ? C.green : C.textDim,
      bg: pd.loanAvailable ? C.greenDim : "rgba(154,136,120,.08)",
      prompt: es
        ? "¿Puedo tomar un préstamo de mi 401(k)? ¿Cuáles son las reglas, límites y cómo funciona el repago?"
        : "Can I take a loan from my 401(k)? What are the rules, limits, and how does repayment work?",
    });

    list.push({
      id: "hardship", emoji: "🆘",
      title: es ? "Dinero de Emergencia" : "Emergency Money Access",
      status: pd.hardshipAvailable === true
        ? (es ? "Disponible en emergencias" : "Available for emergencies")
        : pd.hardshipAvailable === false
          ? (es ? "No disponible" : "Not available")
          : (es ? "Ver documento" : "See your document"),
      desc: pd.hardshipAvailable === false
        ? (es ? "Este plan no permite retiros por dificultad económica." : "This plan does not allow hardship withdrawals.")
        : (es ? "En casos extremos puedes retirar dinero, pero hay impuestos y posibles penalidades." : "In extreme situations you can access your money early — but taxes and penalties may apply."),
      accent: C.warning, bg: "rgba(184,134,11,.07)",
      prompt: es
        ? "¿Puedo hacer un retiro por dificultad? ¿Cuáles son las reglas y circunstancias que califican?"
        : "Can I take a hardship withdrawal? What are the rules and qualifying circumstances?",
    });

    list.push({
      id: "distributions", emoji: "🎯",
      title: es ? "¿Cómo Retiro Mi Dinero?" : "How Do You Get the Money Out?",
      status: es ? "Ver todas las opciones" : "See all your options",
      desc: es
        ? "Al jubilarte o cambiar de trabajo, hay varias formas de acceder a tu dinero."
        : "When you retire or change jobs, you have several options for accessing your savings.",
      accent: C.accent, bg: C.accentDim,
      prompt: es
        ? `Explícame todas las formas en que puedo acceder al dinero en mi 401(k). Para cada opción, dime:\n1. Retiros en servicio — ¿puedo retirar mientras sigo trabajando? ¿A qué edad?\n2. Distribuciones al separarme — si renuncio, me despiden o me jubilo, ¿cuáles son mis opciones?\n3. Rollovers — ¿puedo transferir dinero de otro plan a este?\n4. RMDs — ¿a qué edad tengo que empezar a retirar?\n5. ¿Cuál es la regla del 59½? ¿Qué es la penalidad del 10%?`
        : `Explain all the ways I can access money in my 401(k). For each option, tell me:\n1. In-service withdrawals — can I take money out while still employed? At what age?\n2. Distributions at separation — if I quit, get laid off, or retire, what are my options?\n3. Rollovers — can I roll money from another plan into this one?\n4. RMDs — at what age do I have to start withdrawing?\n5. What is the age 59½ rule? What is the 10% early withdrawal penalty?`,
    });

    list.push({
      id: "enroll", emoji: "✍️",
      title: es ? "¿Cómo Me Uno?" : "How Do I Sign Up?",
      status: pd.recordkeeperName
        ? (es ? `A través de ${pd.recordkeeperName}` : `Through ${pd.recordkeeperName}`)
        : (es ? "Ver documento" : "See your document"),
      desc: es
        ? "Los pasos exactos para inscribirte y empezar a construir tu jubilación hoy."
        : "The exact steps to enroll and start building your retirement savings today.",
      accent: C.accent, bg: C.accentDim,
      prompt: es
        ? "¿Cómo me inscribo en el plan? ¿Cuáles son los pasos exactos?"
        : "How do I enroll in the plan? What are the exact steps?",
    });

    return list;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planData, lang]);

  // collapsedSections/setCollapsedSections are owned by PlansparencyApp so the
  // calculator's "Check when you qualify" link can expand a section from
  // outside the dashboard. All sections start collapsed; user taps header to expand.
  const toggleSection = (key: string) =>
    setCollapsedSections(prev => ({ ...prev, [key]: !prev[key] }));

  // ── Four named sections that group all tiles ──────────────────────────────
  const SECTIONS = [
    {
      key: "yourMoney",
      color: C.green, dim: C.greenDim,
      icon: "💵",
      title: es ? "Tu Dinero" : "Your Money",
      sub: es ? "Tus aportaciones, opciones de cuenta y cómo crece tu dinero" : "Your contributions, account options, and how your money grows",
      ids: ["eligContrib", "roth", "investments", "enroll"],
    },
    {
      key: "companyMoney",
      color: C.accent, dim: C.accentDim,
      icon: "🏢",
      title: es ? "El Dinero de Tu Empresa" : "Your Company's Money",
      sub: es ? "Lo que tu empleador aporta — y cuándo es realmente tuyo" : "What your employer puts in for you — and when it's truly yours",
      ids: ["safeHarbor", "match", "profitSharing", "vesting"],
    },
    {
      key: "whileEmployed",
      color: "#2C6A9A", dim: "rgba(44,106,154,.11)",
      icon: "💼",
      title: es ? "Tu Acceso Mientras Trabajas" : "Your Access While Employed",
      sub: es ? "Cómo puedes usar tu dinero antes de jubilarte" : "How you can tap your account before you retire",
      ids: ["loans", "hardship"],
    },
    {
      key: "afterEmployment",
      color: "#6B5B9A", dim: "rgba(107,91,154,.11)",
      icon: "🏁",
      title: es ? "Tu Acceso Al Salir" : "Your Access After Employment Ends",
      sub: es ? "Qué pasa con tu dinero cuando te vas o te jubilas" : "Your options when you leave or retire",
      ids: ["distributions"],
    },
  ];

  const renderTile = (tile) => (
    <button key={tile.id} id={tile.id === "eligContrib" ? "when-can-you-start" : undefined} onClick={() => onSectionClick(tile.prompt)} style={{
      background: C.surface, border: `1.5px solid ${tile.accent}28`, borderRadius: 16,
      padding: "14px 12px", cursor: "pointer", fontFamily: F.body,
      textAlign: "left", transition: "all .2s", display: "flex",
      flexDirection: "column", gap: 8, boxShadow: "0 2px 6px rgba(0,0,0,.04)",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 6px 18px ${tile.accent}20`; e.currentTarget.style.borderColor = `${tile.accent}55`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,.04)"; e.currentTarget.style.borderColor = `${tile.accent}28`; }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 4 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: tile.bg, border: `1px solid ${tile.accent}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{tile.emoji}</div>
        <div style={{ fontSize: 9, fontWeight: 700, color: tile.accent, background: `${tile.accent}14`, border: `1px solid ${tile.accent}28`, borderRadius: 20, padding: "3px 7px", maxWidth: "56%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", alignSelf: "flex-start", marginTop: 2 }}>{tile.status}</div>
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.text, lineHeight: 1.3 }}>{tile.title}</div>
      <div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.5, whiteSpace: "pre-line" }}>{tile.desc}</div>
      <div style={{ fontSize: 10, fontWeight: 700, color: tile.accent, display: "flex", alignItems: "center", gap: 3 }}>
        {es ? "Toca para saber más" : "Tap to learn more"}
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
    </button>
  );

  const renderSection = (sec) => {
    const sectionTiles = tiles.filter(tile => sec.ids.includes(tile.id));
    if (sectionTiles.length === 0) return null;
    const collapsed = collapsedSections[sec.key];
    return (
      <div key={sec.key} style={{ marginBottom: collapsed ? 10 : 24 }}>
        {/* Section header — tap to expand / collapse */}
        <button onClick={() => toggleSection(sec.key)} style={{
          width: "100%", display: "flex", alignItems: "center", gap: 10,
          marginBottom: collapsed ? 0 : 10, padding: "10px 12px",
          background: sec.dim, borderRadius: 10,
          border: `1px solid ${sec.color}22`,
          cursor: "pointer", fontFamily: F.body, textAlign: "left",
          transition: "margin-bottom .2s",
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9, flexShrink: 0,
            background: `${sec.color}1A`, border: `1.5px solid ${sec.color}30`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17,
          }}>{sec.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: sec.color, lineHeight: 1.2 }}>{sec.title}</div>
            <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2, lineHeight: 1.4 }}>{sec.sub}</div>
          </div>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={sec.color} strokeWidth="2.5"
            style={{ flexShrink: 0, transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)", transition: "transform .2s" }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
        {/* Cards — hidden when collapsed */}
        {!collapsed && (
          <div style={{
            display: "grid",
            gridTemplateColumns: sectionTiles.length === 1 ? "1fr" : "1fr 1fr",
            gap: 10, alignItems: "start",
          }}>
            {sectionTiles.map(renderTile)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 20px" }}>

        {/* Hero banner */}
        <div style={{
          margin: "0 -16px 20px", padding: "22px 20px 18px",
          background: `linear-gradient(160deg, ${C.accentDim} 0%, rgba(244,239,230,0) 70%)`,
          borderBottom: `1px solid ${C.border}`, textAlign: "center",
        }}>
          <div style={{ fontSize: 38, marginBottom: 6 }}>📋</div>
          <h2 style={{ fontFamily: F.display, fontSize: 21, fontWeight: 700, color: C.text, margin: "0 0 4px", lineHeight: 1.2 }}>{planName}</h2>
          <p style={{ fontSize: 12, color: C.textMuted, margin: "0 0 14px" }}>
            {es ? "Tu guía en lenguaje simple — toca cualquier tarjeta" : "Your plain-English guide — tap any card to learn more"}
          </p>
          {/* Quick-glance stat chips — clickable */}
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            {quickStats.map((s, i) => (
              <button key={i} onClick={() => onSectionClick(s.prompt)} style={{
                background: C.surface, borderRadius: 20, padding: "5px 11px 5px 9px",
                border: `1px solid ${s.color}35`, display: "flex", alignItems: "center", gap: 6,
                cursor: "pointer", fontFamily: F.body, transition: "all .15s",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = `${s.color}12`; e.currentTarget.style.borderColor = `${s.color}60`; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = C.surface; e.currentTarget.style.borderColor = `${s.color}35`; e.currentTarget.style.transform = "none"; }}
              >
                <span style={{ fontSize: 13 }}>{s.emoji}</span>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 9, color: C.textDim, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", lineHeight: 1 }}>{s.label}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: s.color, lineHeight: 1.3 }}>{s.value || "?"}</div>
                </div>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="2.5" opacity={0.5} style={{ flexShrink: 0, marginLeft: 1 }}><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            ))}
          </div>
        </div>

        {/* Four grouped sections */}
        {SECTIONS.map(renderSection)}

      </div>
    </div>
  );
}
