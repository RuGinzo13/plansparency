// Node.js runtime — handles large request bodies (no Edge 4 MB limit)
// and supports FormData natively via the Web Fetch API in Node 18+.
export const runtime = 'nodejs';
export const maxDuration = 120;

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/ratelimit';
import {
  ANTHROPIC_API_VERSION,
  ANTHROPIC_BETA_FILES,
  ANTHROPIC_FILES_URL,
  FILE_EXPIRY_SECONDS,
} from '@/lib/anthropic/client';

function jsonError(msg: string, status = 500): NextResponse {
  return NextResponse.json({ error: msg }, { status });
}

// ── Accepts multipart/form-data with a 'file' field (browser direct upload) ───
// Forwards the PDF to the Anthropic Files API and returns its file_id.
export async function POST(req: NextRequest): Promise<Response> {
  // ── 1. Auth ───────────────────────────────────────────────────────────────
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return jsonError('API key not configured', 500);

  // ── 1b. Rate limit (per IP) ──────────────────────────────────────────────
  // Fails open if Upstash is unconfigured/unreachable. Client surfaces 429.
  const rl = await checkRateLimit(req, 'ingest');
  if (!rl.ok) return jsonError('Too many uploads — please wait a minute and try again.', 429);

  // ── 2. Resolve the PDF bytes from the multipart body ──────────────────────
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch (e: any) {
    return jsonError(`Failed to parse form data: ${e.message}`, 400);
  }

  const fileField = formData.get('file');
  if (!fileField || !(fileField instanceof Blob)) {
    return jsonError('Missing or invalid file field in form data', 400);
  }
  const pdfBlob: Blob = fileField;

  // ── 3. Forward to Anthropic Files API ─────────────────────────────────────
  const upstream = new FormData();
  upstream.append('file', pdfBlob, 'upload.pdf');
  upstream.append('expires_in_seconds', String(FILE_EXPIRY_SECONDS));

  let anthropicRes: Response;
  try {
    anthropicRes = await fetch(ANTHROPIC_FILES_URL, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_API_VERSION,
        'anthropic-beta': ANTHROPIC_BETA_FILES,
        // Do NOT set Content-Type — fetch sets it automatically with the boundary
      },
      body: upstream,
    });
  } catch (e: any) {
    if (e.name === 'AbortError') return jsonError('Upload timed out', 504);
    return jsonError(`Network error: ${e.message}`, 502);
  }

  // ── 4. Handle Anthropic response ──────────────────────────────────────────
  if (!anthropicRes.ok) {
    const text = await anthropicRes.text().catch(() => '');
    let errMsg = 'Anthropic upload failed';
    try {
      const parsed = JSON.parse(text);
      errMsg = parsed?.error?.message || (typeof parsed?.error === 'string' ? parsed.error : errMsg);
    } catch {}
    return jsonError(String(errMsg), 502);
  }

  let responseJson: any;
  try {
    responseJson = await anthropicRes.json();
  } catch {
    return jsonError('Invalid response from Anthropic', 502);
  }

  if (!responseJson?.id) return jsonError('No file ID returned from Anthropic', 502);

  // ── 5. Return file_id to client ───────────────────────────────────────────
  return NextResponse.json({ fileId: responseJson.id });
}
