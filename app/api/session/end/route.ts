// Node.js runtime — deletes uploaded Anthropic files when a session ends
// (button click, new upload, tab close via sendBeacon, or 30-min idle).
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/ratelimit';
import {
  ANTHROPIC_API_VERSION,
  ANTHROPIC_BETA_FILES,
  ANTHROPIC_FILES_URL,
  FILE_ID_PATTERN,
} from '@/lib/anthropic/client';

const MAX_IDS = 10;

export async function POST(req: NextRequest): Promise<Response> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'API key not configured' }, { status: 500 });

  const rl = await checkRateLimit(req, 'end');
  if (!rl.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  // Read as text so this also accepts navigator.sendBeacon's text/plain body.
  let body: any;
  try {
    const raw = await req.text();
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ deleted: 0 });
  }

  const requestedIds: unknown = body?.fileIds;
  const validIds = Array.isArray(requestedIds)
    ? requestedIds.filter((id): id is string => typeof id === 'string' && FILE_ID_PATTERN.test(id)).slice(0, MAX_IDS)
    : [];

  if (validIds.length === 0) return NextResponse.json({ deleted: 0 });

  const results = await Promise.allSettled(
    validIds.map(async (id) => {
      const res = await fetch(`${ANTHROPIC_FILES_URL}/${id}`, {
        method: 'DELETE',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': ANTHROPIC_API_VERSION,
          'anthropic-beta': ANTHROPIC_BETA_FILES,
        },
      });
      if (!res.ok && res.status !== 404) {
        console.error('[session/end] delete failed:', id, res.status);
        throw new Error('delete failed');
      }
      return true;
    })
  );

  const deleted = results.filter((r) => r.status === 'fulfilled').length;
  return NextResponse.json({ deleted });
}
