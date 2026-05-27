export const runtime = 'nodejs'; // Node.js, NOT Edge — needed for Buffer operations

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // ── 1. Parse + validate body ───────────────────────────────────────────────
    let body: { pdfBase64?: string; planData?: object; initialSummary?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { pdfBase64, planData, initialSummary } = body;

    if (!pdfBase64 || !planData || !initialSummary) {
      return NextResponse.json(
        { error: 'Missing required fields: pdfBase64, planData, initialSummary' },
        { status: 400 },
      );
    }

    // ── 2. Generate IDs ────────────────────────────────────────────────────────
    const plan_id = crypto.randomUUID();
    const advisor_token = crypto.randomUUID();

    // ── 3. Convert base64 → Buffer and upload to Supabase Storage ─────────────
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');
    const storagePath = `${plan_id}/plan.pdf`;

    const { error: storageError } = await supabaseAdmin.storage
      .from('plan-documents')
      .upload(storagePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (storageError) {
      return NextResponse.json(
        { error: 'Storage upload failed', detail: storageError.message },
        { status: 500 },
      );
    }

    // ── 4. Insert row into plans table ─────────────────────────────────────────
    const pd = planData as Record<string, any>;

    const { error: dbError } = await supabaseAdmin.from('plans').insert({
      plan_id,
      advisor_token,
      employer_name: pd.employerName ?? null,
      plan_name: pd.planName ?? pd.employerName ?? null,
      ein: pd.ein ?? null,
      plan_number: pd.planNumber ?? null,
      plandata_json: planData,
      initial_summary: initialSummary,
      pdf_storage_path: storagePath,
    });

    if (dbError) {
      return NextResponse.json(
        { error: 'Database insert failed', detail: dbError.message },
        { status: 500 },
      );
    }

    // ── 5. Return success ──────────────────────────────────────────────────────
    return NextResponse.json(
      { plan_id, advisor_token, share_url: `/p/${plan_id}` },
      { status: 200 },
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: 'Unexpected error', detail: e?.message ?? String(e) },
      { status: 500 },
    );
  }
}
