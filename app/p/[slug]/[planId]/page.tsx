import { supabaseAdmin } from '@/lib/supabase';
import PlansparencyApp from '@/components/PlansparencyApp';

export default async function ParticipantPage({ params }: { params: { slug: string; planId: string } }) {
  const { data: plan } = await supabaseAdmin
    .from('plans')
    .select('plan_text, advisor_firm_name, advisor_logo, plan_name')
    .eq('id', params.planId)
    .eq('advisor_slug', params.slug)
    .eq('status', 'active')
    .single();

  if (!plan) {
    return <div style={{ padding: 40, textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h2>Plan not available</h2>
      <p>This plan link is inactive or no longer available. Please contact your advisor.</p>
    </div>;
  }

  return (
    <PlansparencyApp
      mode="version-b"
      preloadedPlanText={plan.plan_text}
      advisorFirmName={plan.advisor_firm_name}
      advisorLogo={plan.advisor_logo}
    />
  );
}
