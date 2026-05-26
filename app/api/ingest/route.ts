// Node.js runtime — handles large request bodies (no Edge 4 MB limit)
// and supports FormData natively via the Web Fetch API in Node 18+.
export const runtime = 'nodejs';
export const maxDuration = 120;

import { del } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

function jsonError(msg: string, status = 500): NextResponse {
  return NextResponse.json({ error: msg }, { status });
}

// ── Accepts one of two request shapes ────────────────────────────────────────
//   1. multipart/form-data  with a 'file' field  (browser direct-upload path)
//   2. application/json     with { blobUrl }      (legacy Vercel Blob path)
export async function POST(req: NextRequest): Promise<Response> {
  // ── 1. Auth ───────────────────────────────────────────────────────────────
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return jsonError('API key not configured', 500);

  // ── 2. Resolve the PDF bytes ──────────────────────────────────────────────
  const contentType = req.headers.get('content-type') ?? '';
  let pdfBlob: Blob;
  let blobUrlToDelete: string | null = null;

  if (contentType.includes('multipart/form-data')) {
    // ── Path A: direct FormData upload from browser ─────────────────────────
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
    pdfBlob = fileField;

  } else {
    // ── Path B: legacy JSON { blobUrl } from Vercel Blob flow ───────────────
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
    blobUrlToDelete = blobUrl;

    try {
      const blobRes = await fetch(blobUrl);
      if (!blobRes.ok) throw new Error(`Blob fetch failed: HTTP ${blobRes.status}`);
      pdfBlob = await blobRes.blob();
    } catch (e: any) {
      return jsonError(`Failed to fetch document: ${e.message}`, 502);
    }
  }

  // ── 3. Forward to Anthropic Files API ─────────────────────────────────────
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
    if (blobUrlToDelete) await del(blobUrlToDelete).catch(() => {});
    if (e.name === 'AbortError') return jsonError('Upload timed out', 504);
    return jsonError(`Network error: ${e.message}`, 502);
  }

  // ── 4. Clean up Vercel Blob (legacy path only) ────────────────────────────
  if (blobUrlToDelete) await del(blobUrlToDelete).catch(() => {});

  // ── 5. Handle Anthropic response ──────────────────────────────────────────
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

  // ── 6. Return file_id to client ───────────────────────────────────────────
  return NextResponse.json({ fileId: responseJson.id });
}
