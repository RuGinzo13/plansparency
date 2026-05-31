// ── Shared rate limiter (Upstash Redis) ──────────────────────────────────────
// Lazy singleton so missing env vars never crash a cold start. If Upstash is not
// configured (local dev / preview without env), checkRateLimit() fails OPEN —
// it allows the request rather than blocking, so behavior is unchanged where
// rate limiting isn't provisioned.
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

let _chatLimiter: Ratelimit | null = null;
let _ingestLimiter: Ratelimit | null = null;
let _configChecked = false;
let _configured = false;

function isConfigured(): boolean {
  if (!_configChecked) {
    _configured = !!(
      process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    );
    _configChecked = true;
  }
  return _configured;
}

function getChatLimiter(): Ratelimit | null {
  if (!isConfigured()) return null;
  if (!_chatLimiter) {
    _chatLimiter = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(20, '1 m'), // 20 chat calls / IP / minute
      prefix: 'rl:chat',
      analytics: false,
    });
  }
  return _chatLimiter;
}

function getIngestLimiter(): Ratelimit | null {
  if (!isConfigured()) return null;
  if (!_ingestLimiter) {
    _ingestLimiter = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 uploads / IP / minute
      prefix: 'rl:ingest',
      analytics: false,
    });
  }
  return _ingestLimiter;
}

// Derive a best-effort client identifier from proxy headers.
function clientId(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'anon';
}

export type RateLimitResult = { ok: true } | { ok: false };

// Returns { ok: false } only when a limiter is configured AND the limit is hit.
// Any error or missing config fails OPEN (returns { ok: true }).
export async function checkRateLimit(
  req: Request,
  kind: 'chat' | 'ingest',
): Promise<RateLimitResult> {
  const limiter = kind === 'chat' ? getChatLimiter() : getIngestLimiter();
  if (!limiter) return { ok: true };
  try {
    const { success } = await limiter.limit(clientId(req));
    return success ? { ok: true } : { ok: false };
  } catch {
    // Redis unreachable — don't take the app down over rate limiting.
    return { ok: true };
  }
}
