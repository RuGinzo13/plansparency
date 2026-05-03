import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// ── Anthropic client ─────────────────────────────────────────────────────────
// Constructed once at module load; intentionally does not throw on missing key
// so the 500 response below is the single source of truth for that error.
const anthropicKey = process.env.ANTHROPIC_API_KEY || '';
const client = new Anthropic({ apiKey: anthropicKey });

// ── PDF text extraction with fallback ────────────────────────────────────────
async function extractPdfText(buffer: Buffer): Promise<string> {
  // Primary: pdf-parse
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pdfParse = require('pdf-parse');
    const parsed = await pdfParse(buffer);
    if (parsed?.text && parsed.text.trim().length > 0) {
      return parsed.text;
    }
    console.error('[pdf] pdf-parse returned empty text');
  } catch (primaryErr) {
    console.error('[pdf] pdf-parse failed, trying raw text fallback:', primaryErr);
  }

  // Fallback: extract printable ASCII runs from the raw PDF bytes.
  // Works for uncompressed/partially-compressed PDFs; better than nothing.
  try {
    const raw = buffer.toString('latin1');
    const strings = raw.match(/[\x20-\x7E\n\r\t]{6,}/g) ?? [];
    const text = strings
      .filter(s => s.trim().length > 5)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (text.length > 200) {
      console.error('[pdf] Using raw text fallback — quality may be reduced');
      return text;
    }
    console.error('[pdf] Raw text fallback produced insufficient content');
  } catch (fallbackErr) {
    console.error('[pdf] Raw text fallback also failed:', fallbackErr);
  }

  throw new Error(
    'Unable to extract text from this PDF. The file may be scanned, password-protected, or corrupted.'
  );
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest): Promise<NextResponse> {
  // ── 1. API key check ───────────────────────────────────────────────────────
  if (!anthropicKey) {
    console.error('[chat] ANTHROPIC_API_KEY is not configured');
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  // ── 2. Rate limiting (optional — skipped if Upstash env vars not set) ──────
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      const ratelimit = new Ratelimit({
        redis: new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL,
          token: process.env.UPSTASH_REDIS_REST_TOKEN,
        }),
        limiter: Ratelimit.slidingWindow(10, '1 h'),
      });
      const ip = req.headers.get('x-forwarded-for') ?? 'anonymous';
      const { success } = await ratelimit.limit(ip);
      if (!success) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again in an hour.' },
          { status: 429 }
        );
      }
    } catch (rlErr) {
      // Redis unavailable — log and continue without rate limiting
      console.error('[chat] Rate limit check failed (continuing without):', rlErr);
    }
  }

  // ── 3. Parse and validate request body ────────────────────────────────────
  let body: {
    messages?: { role: 'user' | 'assistant'; content: string }[];
    systemPrompt?: string;
    blobUrl?: string;
    extractedText?: string;
    maxTokens?: number;
  };

  try {
    body = await req.json();
  } catch (parseErr) {
    console.error('[chat] Failed to parse request body:', parseErr);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { messages, systemPrompt, blobUrl, extractedText, maxTokens = 4096 } = body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    console.error('[chat] Missing or empty messages array');
    return NextResponse.json({ error: 'Missing required field: messages' }, { status: 400 });
  }
  if (!systemPrompt || typeof systemPrompt !== 'string') {
    console.error('[chat] Missing systemPrompt');
    return NextResponse.json({ error: 'Missing required field: systemPrompt' }, { status: 400 });
  }

  // ── 4. PDF text extraction ─────────────────────────────────────────────────
  // If extractedText is cached from a prior call, use it directly (no fetch needed).
  // If blobUrl is provided, fetch the PDF from Vercel Blob and extract text.
  let textContent: string | null = extractedText ?? null;

  if (blobUrl && !textContent) {
    try {
      console.log('[chat] Fetching PDF from blob:', blobUrl);
      const pdfResponse = await fetch(blobUrl);
      if (!pdfResponse.ok) {
        throw new Error(`Failed to fetch PDF from storage (${pdfResponse.status})`);
      }
      const arrayBuffer = await pdfResponse.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      textContent = await extractPdfText(buffer);
    } catch (pdfErr) {
      const msg = pdfErr instanceof Error ? pdfErr.message : 'PDF extraction failed';
      console.error('[chat] PDF extraction error:', msg);
      return NextResponse.json({ error: msg }, { status: 422 });
    }
  }

  // ── 5. Build messages (prepend extracted text to first message) ────────────
  const processedMessages = messages.map(
    (m: { role: 'user' | 'assistant'; content: string }, i: number) => {
      if (i === 0 && textContent) {
        return { ...m, content: `${textContent}\n\n${m.content}` };
      }
      return m;
    }
  );

  // ── 6. Call Anthropic with 55-second timeout ───────────────────────────────
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), 55_000);

  let anthropicResponse: Awaited<ReturnType<typeof client.messages.create>>;
  try {
    anthropicResponse = await client.messages.create(
      {
        model: 'claude-sonnet-4-6',
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: processedMessages,
      },
      { signal: timeoutController.signal }
    );
  } catch (anthropicErr) {
    clearTimeout(timeoutId);

    if (anthropicErr instanceof Error && anthropicErr.name === 'AbortError') {
      console.error('[chat] Anthropic call timed out after 55s');
      return NextResponse.json(
        { error: 'The AI took too long to respond. Please try again with a smaller document.' },
        { status: 504 }
      );
    }

    // Surface the real Anthropic error (auth failure, model error, etc.)
    const errMsg =
      anthropicErr instanceof Error ? anthropicErr.message : 'Unknown Anthropic error';
    console.error('[chat] Anthropic API error:', errMsg, anthropicErr);
    return NextResponse.json({ error: `AI service error: ${errMsg}` }, { status: 502 });
  }
  clearTimeout(timeoutId);

  // ── 7. Return response ─────────────────────────────────────────────────────
  return NextResponse.json({
    content: anthropicResponse.content,
    extractedText: textContent,
  });
}
