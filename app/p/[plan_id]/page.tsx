// Server component — no 'use client'
import { getSupabaseAdmin } from '@/lib/supabase-server';
import PlansparencyApp from '@/components/PlansparencyApp';

// ── Dynamic metadata — static export cannot reference async data ──────────────
export async function generateMetadata({ params }: { params: Promise<{ plan_id: string }> }) {
  const { plan_id } = await params;
  const { data: plan } = await getSupabaseAdmin()
    .from('plans')
    .select('employer_name')
    .eq('plan_id', plan_id)
    .single();

  return {
    title: `${plan?.employer_name ?? 'Your'} 401(k) Plan — Plansparency`,
  };
}

// ── Not-found fallback ─────────────────────────────────────────────────────────
function PlanNotFound({ note }: { note?: string }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0F1621',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
      fontFamily: "'DM Sans','Segoe UI',sans-serif",
    }}>
      <p style={{ fontSize: 16, color: '#F4EFE6', textAlign: 'center', maxWidth: 420, lineHeight: 1.6, margin: 0 }}>
        Plan not found. Ask your plan advisor for the correct link.
        {note && <><br /><span style={{ color: '#9A8878', fontSize: 13 }}>{note}</span></>}
      </p>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default async function ParticipantPlanPage({ params }: { params: Promise<{ plan_id: string }> }) {
  const { plan_id } = await params;

  // 1. Fetch plan row
  const { data: plan, error: planError } = await getSupabaseAdmin()
    .from('plans')
    .select('*')
    .eq('plan_id', plan_id)
    .single();

  if (planError || !plan) {
    return <PlanNotFound />;
  }

  // 2. Fetch PDF from Supabase Storage and convert to base64
  const { data: blob, error: storageError } = await getSupabaseAdmin().storage
    .from('plan-documents')
    .download(plan.pdf_storage_path);

  if (storageError || !blob) {
    return <PlanNotFound note="There was a problem loading this plan document. Please contact your advisor." />;
  }

  const arrayBuffer = await blob.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');

  // 3. Fire-and-forget session row — do not await, don't block the page
  void getSupabaseAdmin().from('plan_sessions').insert({ plan_id: plan.plan_id });

  // 4. Build initial messages from the stored summary
  const initialMessages = [{ role: 'assistant', content: plan.initial_summary }];

  // 5. Render the client app pre-loaded with plan data
  return (
    <PlansparencyApp
      initialPdfBase64={base64}
      initialPlanData={plan.plandata_json}
      initialMessages={initialMessages}
      initialStage="app"
    />
  );
}
