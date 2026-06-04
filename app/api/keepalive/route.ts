// Keep-alive endpoint — prevents Supabase free-tier auto-pause.
//
// Supabase pauses free-tier projects after ~7 days with no activity. A Vercel
// cron (see vercel.json) calls this route once a day; the trivial DB query
// below counts as activity and resets the idle clock. Read-only, returns no
// row data — just a count — so it's safe and cheap.
//
// Optional protection: if CRON_SECRET is set in Vercel env, the request must
// carry `Authorization: Bearer <CRON_SECRET>` (Vercel cron sends this header
// automatically). If CRON_SECRET is unset, the route is open — harmless, since
// it exposes only a row count.

export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function GET(req: NextRequest): Promise<Response> {
  // Optional auth — only enforced when CRON_SECRET is configured.
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    // Minimal request: HEAD-style count, no row payload. Registers activity.
    const { error } = await getSupabaseAdmin()
      .from('plans')
      .select('id', { count: 'exact', head: true });

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, pingedAt: new Date().toISOString() });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? 'keepalive failed' },
      { status: 500 }
    );
  }
}
