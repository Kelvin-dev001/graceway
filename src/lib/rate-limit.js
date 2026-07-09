import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { headers } from 'next/headers';

const hasUpstashConfig = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

if (!hasUpstashConfig) {
  console.warn(
    '[rate-limit] UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN not set — rate limiting is disabled. ' +
    'Set both in .env.local to enable it locally.'
  );
}

const redis = hasUpstashConfig ? Redis.fromEnv() : null;

// IP-keyed limiters (login, signup) are meaningless in local dev/CI: `next dev` has no
// reverse proxy, so x-forwarded-for/x-real-ip are absent and every request resolves to
// the same 'unknown' key. Enforcing them there would make the many real signIn() calls
// across the existing Playwright suite collide in one shared bucket and fail
// unpredictably. So: enforce only in production, or when explicitly forced for a
// dedicated isolated test run.
const ipLimitersEnabled =
  hasUpstashConfig && (process.env.NODE_ENV === 'production' || process.env.RATE_LIMIT_FORCE_ENABLED === 'true');

if (hasUpstashConfig && !ipLimitersEnabled) {
  console.warn(
    '[rate-limit] IP-keyed login/signup limits are disabled outside production ' +
    '(set RATE_LIMIT_FORCE_ENABLED=true to exercise them locally/in a dedicated test run).'
  );
}

function makeLimiter(prefix, limit, window) {
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, window),
    prefix: `graceway:ratelimit:${prefix}`,
    analytics: false,
  });
}

// user.id-keyed — safe to always run when Upstash creds are present. Real users never
// collide with each other, dev/CI included, so no NODE_ENV gate is needed here.
const quizSubmitLimiter = hasUpstashConfig ? makeLimiter('quiz-submit', 10, '60 s') : null;
const loginLimiter = ipLimitersEnabled ? makeLimiter('login', 10, '60 s') : null;
const signupLimiter = ipLimitersEnabled ? makeLimiter('signup', 5, '3600 s') : null;

export async function getClientIp() {
  const headersList = await headers();
  const forwardedFor = headersList.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  const realIp = headersList.get('x-real-ip');
  if (realIp) return realIp;
  return 'unknown';
}

async function check(limiter, identifier) {
  if (!limiter) return { success: true };
  try {
    return await limiter.limit(identifier);
  } catch (err) {
    // Fail OPEN: Upstash being down must never take down login/signup/quiz submission
    // for this platform — the real security boundary is Supabase Auth, not this
    // secondary throughput guard.
    console.error('[rate-limit] Upstash check failed, allowing request through:', err);
    return { success: true };
  }
}

function toErrorResult(result) {
  if (result.success) return { success: true };
  const retryAfterSeconds = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
  return {
    success: false,
    error: `Too many attempts. Please try again in ${retryAfterSeconds} second${retryAfterSeconds === 1 ? '' : 's'}.`,
  };
}

export async function checkLoginRateLimit(ip) {
  return toErrorResult(await check(loginLimiter, ip));
}
export async function checkSignupRateLimit(ip) {
  return toErrorResult(await check(signupLimiter, ip));
}
export async function checkQuizSubmitRateLimit(userId) {
  return toErrorResult(await check(quizSubmitLimiter, userId));
}
