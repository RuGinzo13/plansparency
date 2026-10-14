export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { normalizeTeam } from '@/lib/team';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_BODY_BYTES = 1_200_000;

type Ctx = { params: Promise<{ plan_id: string }> };

// Same guard as /api/save-plan: require a Clerk session only when Clerk is configured.
// (middleware.ts always requires the advisor password for this path as well.)
async function guard(): Promise<NextResponse | null> {
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export async function GET(_req: NextRequest, { params }: Ctx): Promise<NextResponse> {
  try {
    const denied = await guard();
    if (denied) return denied;
    const { plan_id } = await params;
    if (!UUID_RE.test(plan_id)) return NextResponse.json({ error: 'Invalid plan id' }, { status: 400 });

    const { data, error } = await getSupabaseAdmin()
      .from('plans')
      .select('employer_name, team_json, planName:plandata_json->>planName')
      .eq('plan_id', plan_id)
      .maybeSingle();
    if (error) return NextResponse.json({ error: 'Could not load the team' }, { status: 500 });
    if (!data) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });

    const row = data as unknown as { employer_name: string | null; team_json: unknown; planName: string | null };
    return NextResponse.json({
      planName: row.planName ?? '',
      employerName: row.employer_name ?? '',
      team: normalizeTeam(row.team_json).team,
    });
  } catch {
    return NextResponse.json({ error: 'Could not load the team' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Ctx): Promise<NextResponse> {
  try {
    const denied = await guard();
    if (denied) return denied;
    const { plan_id } = await params;
    if (!UUID_RE.test(plan_id)) return NextResponse.json({ error: 'Invalid plan id' }, { status: 400 });

    const text = await req.text();
    if (text.length > MAX_BODY_BYTES) return NextResponse.json({ error: 'Too large' }, { status: 413 });
    let body: { team?: unknown };
    try { body = JSON.parse(text); } catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }); }

    const { team, errors } = normalizeTeam(body?.team);
    if (errors.length) return NextResponse.json({ errors }, { status: 400 });

    const { data, error } = await getSupabaseAdmin()
      .from('plans')
      .update({ team_json: team })
      .eq('plan_id', plan_id)
      .select('plan_id');
    if (error) return NextResponse.json({ error: 'Could not save the team' }, { status: 500 });
    if (!data || data.length === 0) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });

    return NextResponse.json({ team });
  } catch {
    return NextResponse.json({ error: 'Could not save the team' }, { status: 500 });
  }
}
