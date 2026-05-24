export const runtime = 'edge';
export const maxDuration = 60;

import { del } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

function jsonError(msg: string, status = 500): NextResponse {
  return NextResponse.json({ error: msg }, { status });
}

// Accepts a Vercel Blob URL, fetches the PDF server-to-server (no Lambda body-size issue),
// uploads it to the Anthropic Files API, deletes the blob, and returns the file_id.
export async function POST(req: NextRequest): Promise<Response> {
  // ── 1. Auth ───────────────────────────────────────────────────────────────────
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return jsonError('API key not configured', 500);

  // ── 2. Parse body ─────────────────────────────────────────────────────────────
  let body: { blobUrl?: unknown };
  try {
    body = await req.json();
  } catch {
    return jsonError('Invalid request body', 400);
  }

  const { blobUrl } = body;
  if (!blobUrl || typeof blobUrl !== 'string') {
    return jsonError('Missing or invalid blobUrl', 400);
  }

  // ── 3. Fetch PDF from Vercel Blob ─────────────────────────────────────────────
  let pdfBlob: Blob;
  try {
    const blobRes = await fetch(blobUrl);
    if (!blobRes.ok) throw new Error(`Blob fetch failed: HTTP ${blobRes.status}`);
    pdfBlob = await blobRes.blob();
  } catch (e: any) {
    return jsonError(`Failed to fetch document: ${e.message}`, 502);
  }

  // ── 4. Forward to Anthropic Files API ────────────────────────────────────────
  const upstream = new FormData();
  upstream.append('file', pdfBlob, 'upload.pdf');

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
    await del(blobUrl).catch(() => {});
    if (e.name === 'AbortError') return jsonError('Upload timed out', 504);
    return jsonError(`Network error: ${e.message}`, 502);
  }

  // ── 5. Delete blob regardless of Anthropic outcome ───────────────────────────
  await del(blobUrl).catch(() => {});

  // ── 6. Handle Anthropic response ─────────────────────────────────────────────
  if (!anthropicRes.ok) {
    const text = await anthropicRes.text().catch(() => '');
    let errMsg = 'Anthropic upload failed';
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

  if (!responseJson?.id) return jsonError('No file ID returned from Anthropic', 502);

  // ── 7. Return file_id to client ───────────────────────────────────────────────
  return NextResponse.json({ fileId: responseJson.id });
}
