import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { kv } from '@vercel/kv';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require('pdf-parse');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'anonymous';
  const rateLimitKey = `ratelimit:${ip}`;

  try {
    const count = await kv.incr(rateLimitKey);
    if (count === 1) await kv.expire(rateLimitKey, 3600);
    if (count > 10) {
      return NextResponse.json({ error: 'Rate limit exceeded. Please try again in an hour.' }, { status: 429 });
    }
  } catch {
    // If KV is unavailable in dev, continue without rate limiting
  }

  const { messages, systemPrompt, pdfBase64, extractedText } = await req.json();

  let textContent = extractedText ?? null;

  if (pdfBase64 && !textContent) {
    const buffer = Buffer.from(pdfBase64, 'base64');
    const parsed = await pdfParse(buffer);
    textContent = parsed.text;
  }

  const processedMessages = messages.map((m: any, i: number) => {
    if (i === 0 && textContent) {
      return { ...m, content: `${textContent}\n\n${m.content}` };
    }
    return m;
  });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: systemPrompt,
    messages: processedMessages,
  });

  return NextResponse.json({
    content: response.content,
    extractedText: textContent,
  });
}
