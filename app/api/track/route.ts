export const runtime = 'edge';
import { STOCK_QUESTIONS } from '@/lib/answers/stockAnswers';

// Counts stock-answer taps. Stores nothing: one log line with the question id.
export async function POST(req: Request): Promise<Response> {
  let body: any;
  try { body = await req.json(); } catch { return new Response(null, { status: 400 }); }
  const ok = body && body.event === 'stock_answer' && typeof body.id === 'string' && STOCK_QUESTIONS.some((q) => q.id === body.id);
  if (!ok) return new Response(null, { status: 400 });
  console.log(JSON.stringify({ event: 'stock_answer', id: body.id }));
  return new Response(null, { status: 204 });
}
