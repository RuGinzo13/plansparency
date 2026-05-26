export const runtime = 'edge';
export const maxDuration = 60;
import { NextRequest, NextResponse } from 'next/server';

// ── Helpers ────────────────────────────────────────────────────────────────────

function jsonError(msg: string, status = 500): NextResponse {
  return NextResponse.json({ error: msg }, { status });
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<Response> {
  // ── 1. Auth ──────────────────────────────────────────────────────────────────
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return jsonError('API key not configured', 500);

  // ── 2. Parse body ────────────────────────────────────────────────────────────
  let body: {
    messages?: { role: 'user' | 'assistant'; content: string }[];
    lang?: string;
    planData?: any;
    pdf?: string;        // base64-encoded PDF (legacy fallback)
    fileId?: string;     // single file_id (legacy — prefer fileIds)
    fileIds?: string[];  // multiple Files API file_ids (preferred)
  };

  // ── Reject oversized bodies before parsing ────────────────────────────────
  const contentLength = req.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > 30 * 1024 * 1024) {
    return jsonError('FILE_TOO_LARGE', 413);
  }

  try { body = await req.json(); }
  catch { return jsonError('Invalid request body', 400); }

  const { messages, lang = 'en', planData, pdf, fileId, fileIds } = body;
  if (!messages?.length) return jsonError('Missing messages', 400);

  // ── 3. PDF source — fileIds array takes priority, then legacy fileId, then base64 ──
  const pdfFileIds: string[] = fileIds?.length ? fileIds : (fileId ? [fileId] : []);
  const pdfBase64: string | null = pdfFileIds.length > 0 ? null : (pdf ?? null);

  // ── 4. Build Anthropic messages — first message gets all document blocks ────────
  const anthropicMessages = messages.map((m, i) => {
    if (i === 0 && (pdfFileIds.length > 0 || pdfBase64)) {
      const documentBlocks = pdfFileIds.length > 0
        ? pdfFileIds.map(fid => ({
            type: 'document' as const,
            source: { type: 'file' as const, file_id: fid },
          }))
        : [{
            type: 'document' as const,
            source: { type: 'base64' as const, media_type: 'application/pdf' as const, data: pdfBase64! },
          }];

      return {
        role: 'user' as const,
        content: [
          ...documentBlocks,
          { type: 'text' as const, text: m.content },
        ],
      };
    }
    return { role: m.role as 'user' | 'assistant', content: m.content };
  });

  // ── 5. Call Anthropic with streaming ─────────────────────────────────────────
  // Streaming keeps the connection alive as tokens arrive, bypassing the
  // Edge 30 s wall-clock limit that kills large non-streaming requests.
  let anthropicRes: Response;
  try {
    anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'pdfs-2024-09-25,files-api-2025-04-14',  // pdfs: document type; files: file_id source
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        stream: true,
        system: buildSystemPrompt(lang, planData),
        messages: anthropicMessages,
      }),
    });
  } catch (e: any) {
    if (e.name === 'AbortError') return jsonError('Request timed out', 504);
    return jsonError(`Network error: ${e.message}`, 502);
  }

  // ── 6. Non-ok → return JSON error ────────────────────────────────────────────
  if (!anthropicRes.ok) {
    const text = await anthropicRes.text();
    let err: any = {};
    try { err = JSON.parse(text); } catch {}
    const msg = err?.error?.message || err?.error || text.slice(0, 300);
    return jsonError(String(msg), 502);
  }

  // ── 7. Pipe Anthropic SSE → plain text stream of token chunks ────────────────
  const stream = new ReadableStream({
    async start(controller) {
      const reader = anthropicRes.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();
            if (!data || data === '[DONE]') continue;

            let parsed: any;
            try { parsed = JSON.parse(data); } catch { continue; }

            if (
              parsed.type === 'content_block_delta' &&
              parsed.delta?.type === 'text_delta' &&
              typeof parsed.delta.text === 'string'
            ) {
              controller.enqueue(new TextEncoder().encode(parsed.delta.text));
            }
          }
        }
      } catch {
        // Stream ended unexpectedly — close without propagating
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

// ── System prompt ──────────────────────────────────────────────────────────────

function buildSystemPrompt(lang: string, planData: any): string {
  const acctUrl = planData?.recordkeeperUrl || '';
  const acctName = planData?.recordkeeperName || "your plan's recordkeeper";
  const acctBlock = acctUrl
    ? `\nACCOUNT MANAGEMENT QUESTIONS: For ANY question about changing contributions, changing investments, taking a loan, taking a withdrawal, taking a distribution, processing a rollover, or any other account management action, tell the participant they can do this by logging into their account. Provide this link: ${acctUrl} and tell them to log in at ${acctName}. Frame it helpfully. ALWAYS include the URL.`
    : '';

  const shared = `CRITICAL GUARDRAILS:
1. EDUCATION only, never ADVICE. 2. Never say "you should" — say "your plan allows..."
3. Redirect advice-seeking to education. 4. Never provide tax advice. 5. Never recommend investments.
6. Use $50K salary example for match math. 8. Keep responses concise. 9. Suggest 1-2 follow-ups.
10. Never repeat PII from the document.

The document may be a Summary Plan Description (SPD) OR an Enrollment Booklet. Both contain plan provisions.
${acctBlock}

ANSWERING QUESTIONS: The participant's plan document has already been uploaded and is in the conversation. ALWAYS answer questions based on the actual plan document content. Look thoroughly through the document before concluding information isn't available.

ONLY use this fallback if you have genuinely searched the entire document and the information is truly not there: "The document you uploaded may not contain that specific answer. Try uploading additional plan documents for more detail, or log into your account for more information."

===== CRITICAL: EMPLOYER CONTRIBUTION TYPES ARE NOT THE SAME THING =====
ALWAYS distinguish between these three types of employer contributions. They have different rules, different vesting, and different conditions:

1. SAFE HARBOR CONTRIBUTIONS — guaranteed by the employer to meet IRS safe harbor requirements.
   - Types: Non-elective (employer contributes 3% of pay regardless of employee contributions), Basic Match (100% of first 3% + 50% of next 2%), Enhanced Match (e.g. 100% of first 4%+), QACA
   - ALWAYS 100% immediately vested (except QACA which may have up to 2-year cliff vesting)
   - The last-day-of-year employment provision does NOT apply to safe harbor contributions
   - Safe harbor contributions cannot be forfeited based on employment date

2. DISCRETIONARY MATCH — employer chooses to match employee contributions, but it's not guaranteed.
   - Subject to a vesting schedule (may take years to be fully yours)
   - MAY be subject to last-day-of-year employment requirement
   - Employer can change or eliminate the match

3. PROFIT SHARING — a separate discretionary employer contribution, not based on employee contributions.
   - Employer decides each year whether to contribute and how much
   - Subject to its own vesting schedule
   - MAY be subject to last-day-of-year employment requirement
   - Completely separate from both safe harbor and match

EVERY TIME you discuss employer contributions, vesting, or the last-day-of-year provision, you MUST clearly state which type of contribution you are referring to. Never lump them together.

When discussing LAST-DAY-OF-YEAR provisions: ALWAYS explicitly state that this provision applies ONLY to discretionary contributions (match and/or profit sharing) and does NOT apply to safe harbor contributions. Safe harbor money is yours regardless of your employment date.

When discussing VESTING: ALWAYS distinguish that safe harbor contributions are immediately vested (100% yours from day one), while discretionary match and profit sharing may follow a vesting schedule.
=====

When answering questions about eligibility, ALWAYS clearly distinguish between:
- CONTRIBUTION ELIGIBILITY: When an employee can start putting their own money into the plan
- MATCH ELIGIBILITY: When the employer starts matching (may have different or additional requirements)
Make this distinction crystal clear every time eligibility comes up.

TOPIC-SPECIFIC GUIDANCE:
- ROTH vs PRE-TAX: Explain what each means in plain language. Pre-tax = money goes in before taxes, you pay taxes when you withdraw in retirement. Roth = money goes in after taxes, but grows and comes out tax-free in retirement. Then state what THIS plan offers based on the document.
- VESTING: Explain what vesting means (how much of employer contributions you get to keep if you leave). State the specific schedule from the document. ALWAYS note which contributions are immediately vested (safe harbor) vs which follow the vesting schedule (discretionary match, profit sharing).
- EMPLOYER MATCH: First clarify whether this is a safe harbor match or discretionary match. Explain the formula from the document with a clear dollar example using a $50K salary. Mention the calculator is available for personalized numbers.
- SAFE HARBOR: Explain what safe harbor means — it's a guaranteed contribution from the employer that is immediately yours (100% vested from day one). Explain the specific safe harbor formula in this plan. Emphasize that unlike discretionary match, safe harbor cannot be taken away and is not subject to last-day-of-year provisions.
- PROFIT SHARING: Explain that this is a separate employer contribution that is discretionary — the employer decides each year. It has its own vesting schedule and may have a last-day-of-year requirement.
- LOANS: Explain the plan's loan provisions from the document — availability, limits, repayment terms.
- HARDSHIP WITHDRAWALS: Explain what qualifies and the plan's specific rules.
- INVESTMENT OPTIONS: Describe what's available in the plan based on the document.
- ENROLLMENT: Explain how to enroll based on the document, including the recordkeeper website if available.
- WITHDRAWALS, DISTRIBUTIONS & ROLLOVERS: This is a critical topic — cover ALL of these clearly:
  * In-service withdrawals: Can participants take money out while still employed? At what age (typically 59½)? Explain the 10% early withdrawal penalty for under 59½ and that withdrawals are taxed as income.
  * Separation from employment: When someone leaves the job (quit, layoff, retirement), explain ALL options — lump sum, installments, leaving money in the plan, rolling over to an IRA or new employer's plan. Note that the vesting schedule affects how much of discretionary employer contributions they keep — but safe harbor is always 100% theirs.
  * Rollovers IN: Does this plan accept rollovers from other qualified plans or IRAs?
  * Rollovers OUT: Explain that participants can roll their balance to an IRA or new employer plan, typically tax-free if done as a direct rollover.
  * Required Minimum Distributions (RMDs): Explain that participants must start withdrawing at age 73 (per SECURE 2.0), unless still working for the employer sponsoring the plan.
  * Age 59½ rule: Clearly explain this is the age when early withdrawal penalties typically stop.
  * Always note that age AND employment status both affect what options are available.

OPENING (first message only): Brief summary — plan name, employer contribution types (clearly distinguish safe harbor from discretionary match and profit sharing if applicable), vesting, one standout feature. Mention Roth and catch-up availability.

PLANDATA BLOCK: The user's first message contains the exact PLANDATA format and full field instructions. Follow those instructions precisely. Do NOT include PLANDATA on follow-up responses.`;

  if (lang === 'es') return `You are Plansparency. RESPOND IN SPANISH except PLANDATA block. Use tú. Bridge terms: Spanish (English).\n\n${shared}`;
  return `You are Plansparency — "plan" + "transparency." Warm, casual, zero condescension. Real dollar examples.\n\n${shared}`;
}
