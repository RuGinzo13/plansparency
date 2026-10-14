export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { normalizePlanData } from '@/lib/plan/plandata';
import { REVIEW_ROWS, diffRows } from '@/lib/plan/reviewRows';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_BODY_BYTES = 2_000_000;
const MAX_HISTORY = 50;

type Ctx = { params: Promise<{ plan_id: string }> };
type HistoryEntry = { at: string; by: string; source: 'edit' | 'document'; fileName?: string; note?: string; fields: string[] };

// Same guard as /api/save-plan: require a Clerk session only when Clerk is configured.
// (middleware.ts always requires the advisor password for this path as well.)
async function guard(): Promise<NextResponse | null> {
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

function lastUpdatedOf(planData: any): { at: string; by: string } | null {
  const review = planData?.review;
  const history: HistoryEntry[] = Array.isArray(review?.history) ? review.history : [];
  const last = history[history.length - 1];
  if (last?.at) return { at: last.at, by: last.by };
  if (review?.reviewedAt) return { at: review.reviewedAt, by: review.reviewerName || '' };
  return null;
}

export async function GET(_req: NextRequest, { params }: Ctx): Promise<NextResponse> {
  try {
    const denied = await guard();
    if (denied) return denied;
    const { plan_id } = await params;
    if (!UUID_RE.test(plan_id)) return NextResponse.json({ error: 'Invalid plan id' }, { status: 400 });

    const { data, error } = await getSupabaseAdmin()
      .from('plans').select('employer_name, plandata_json').eq('plan_id', plan_id).maybeSingle();
    if (error) return NextResponse.json({ error: 'Could not load the plan' }, { status: 500 });
    if (!data) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });

    return NextResponse.json({
      planData: data.plandata_json,
      employerName: data.employer_name ?? '',
      lastUpdated: lastUpdatedOf(data.plandata_json),
    });
  } catch {
    return NextResponse.json({ error: 'Could not load the plan' }, { status: 500 });
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
    let body: any;
    try { body = JSON.parse(text); } catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }); }

    const by = typeof body?.by === 'string' ? body.by.trim().slice(0, 80) : '';
    if (!by) return NextResponse.json({ error: 'Add your name.' }, { status: 400 });
    const source: 'edit' | 'document' = body?.source === 'document' ? 'document' : 'edit';
    const note = typeof body?.note === 'string' ? body.note.trim().slice(0, 200) : '';
    const fileName = typeof body?.fileName === 'string' ? body.fileName.trim().slice(0, 120) : '';
    const newEmployer = typeof body?.employerName === 'string' ? body.employerName.trim().slice(0, 120) : undefined;

    const normalized = normalizePlanData(body?.planData);
    if (!normalized) return NextResponse.json({ error: 'Plan details are missing.' }, { status: 400 });
    if (normalized.recordkeeperUrl && !normalized.recordkeeperUrl.startsWith('https://')) normalized.recordkeeperUrl = undefined;

    const db = getSupabaseAdmin();
    const { data: row, error: readErr } = await db
      .from('plans').select('employer_name, plandata_json').eq('plan_id', plan_id).maybeSingle();
    if (readErr) return NextResponse.json({ error: 'Could not load the plan' }, { status: 500 });
    if (!row) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });

    const stored: any = row.plandata_json ?? {};
    // Keep fields normalizePlanData doesn't know about; never trust a review object from the client.
    const { review: storedReview, ...storedRest } = stored;
    const merged: any = { ...storedRest, ...normalized };

    const changedRowKeys = diffRows(stored, merged);
    const labels = REVIEW_ROWS.filter((r) => changedRowKeys.includes(r.key)).map((r) => r.label);
    if (JSON.stringify(stored.fundsData ?? []) !== JSON.stringify(merged.fundsData ?? [])) labels.push('Investment options');
    const employerChanged = newEmployer !== undefined && newEmployer !== (row.employer_name ?? '');
    if (employerChanged) labels.push('Employer name');
    if (labels.length === 0) return NextResponse.json({ error: 'Nothing changed.' }, { status: 400 });

    const at = new Date().toISOString();
    const entry: HistoryEntry = { at, by, source, fields: labels };
    if (fileName) entry.fileName = fileName;
    if (note) entry.note = note;
    const history: HistoryEntry[] = [...(Array.isArray(storedReview?.history) ? storedReview.history : []), entry].slice(-MAX_HISTORY);
    merged.review = { ...(storedReview ?? {}), reviewerName: by, reviewedAt: at, history };

    const update: Record<string, unknown> = { plandata_json: merged };
    if (employerChanged) update.employer_name = newEmployer || null;
    const { error: upErr } = await db.from('plans').update(update).eq('plan_id', plan_id);
    if (upErr) return NextResponse.json({ error: 'Could not save the changes' }, { status: 500 });

    return NextResponse.json({ planData: merged, lastUpdated: { at, by } });
  } catch {
    return NextResponse.json({ error: 'Could not save the changes' }, { status: 500 });
  }
}
