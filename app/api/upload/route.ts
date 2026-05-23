export const runtime = 'edge';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';

function jsonError(msg: string, status = 500): NextResponse {
  return NextResponse.json({ error: msg }, { status });
}

export async function POST(req: NextRequest): Promise<Response> {
  // ── 1. Auth ───────────────────────────────────────────────────────────────────
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return jsonError('API key not configured', 500);

  // ── 2. Parse multipart/form-data ─────────────────────────────────────────────
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return jsonError('Invalid request — expected multipart/form-data', 400);
  }

  const fileEntry = formData.get('file');
  if (!fileEntry || !(fileEntry instanceof File)) {
    return jsonError('Missing file field', 400);
  }

  // ── 3. Forward raw binary to Anthropic Files API ──────────────────────────────
  // We build a fresh FormData so we control the field name Anthropic expects.
  const upstream = new FormData();
  upstream.append('file', fileEntry, fileEntry.name || 'upload.pdf');

  let anthropicRes: Response;
  try {
    anthropicRes = await fetch('https://api.anthropic.com/v1/files', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'files-api-2025-04-14',
        // Do NOT set Content-Type — fetch sets it automatically with the boundary
      },
      body: upstream,
    });
  } catch (e: any) {
    if (e.name === 'AbortError') return jsonError('Upload timed out', 504);
    return jsonError(`Network error: ${e.message}`, 502);
  }

  // ── 4. Handle Anthropic response ──────────────────────────────────────────────
  if (!anthropicRes.ok) {
    const text = await anthropicRes.text().catch(() => '');
    let errMsg = 'Upload failed';
    try {
      const parsed = JSON.parse(text);
      errMsg = parsed?.error?.message || parsed?.error || errMsg;
    } catch {}
    return jsonError(String(errMsg), 502);
  }

  let responseJson: any;
  try {
    responseJson = await anthropicRes.json();
  } catch {
    return jsonError('Invalid response from Anthropic', 502);
  }

  if (!responseJson?.id) {
    return jsonError('No file ID returned from Anthropic', 502);
  }

  // ── 5. Return the file_id to the client ───────────────────────────────────────
  return NextResponse.json({ fileId: responseJson.id });
}
