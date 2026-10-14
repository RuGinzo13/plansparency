export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

// The advisor's plans list: every plan, with only what the list shows.
// Never returns plan details, the PDF path or the advisor token.
// Today everyone with the shared advisor password sees every plan. When advisor accounts
// arrive (OPEN-ITEMS #34) this must filter by advisor.
export async function GET(): Promise<NextResponse> {
  try {
    if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
      const { userId } = await auth();
      if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await getSupabaseAdmin()
      .from('plans')
      .select('plan_id, employer_name, created_at, team_json, planName:plandata_json->>planName, review:plandata_json->review');
    if (error) return NextResponse.json({ error: 'Could not load your plans' }, { status: 500 });

    const plans = (data ?? []).map((row: any) => {
      const history = Array.isArray(row.review?.history) ? row.review.history : [];
      const last = history[history.length - 1];
      let lastUpdated: { at: string; by: string } | null = null;
      if (last?.at) lastUpdated = { at: last.at, by: last.by || '' };
      else if (row.review?.reviewedAt) lastUpdated = { at: row.review.reviewedAt, by: row.review.reviewerName || '' };
      return {
        planId: row.plan_id as string,
        name: (row.planName as string) || (row.employer_name as string) || 'Unnamed plan',
        uploadedAt: row.created_at as string,
        lastUpdated,
        teamCount: Array.isArray(row.team_json) ? row.team_json.length : 0,
      };
    });
    return NextResponse.json({ plans });
  } catch {
    return NextResponse.json({ error: 'Could not load your plans' }, { status: 500 });
  }
}
