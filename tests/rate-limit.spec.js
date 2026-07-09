const { test, expect } = require('@playwright/test');
const { loadEnvLocal } = require('./helpers/env');
loadEnvLocal();
const { Redis } = require('@upstash/redis');

// This spec exercises the LOGIN rate limiter, which is only enabled in production or
// when RATE_LIMIT_FORCE_ENABLED=true (see src/lib/rate-limit.js — IP-keyed limiters are
// meaningless under `next dev`, which has no reverse proxy setting x-forwarded-for, so
// every request in the rest of the suite would otherwise collide into one 'unknown'
// bucket). Run this file in isolation, explicitly, with the flag set for both the test
// process and the `next dev` webServer child it spawns (child inherits parent env):
//   RATE_LIMIT_FORCE_ENABLED=true npx playwright test tests/rate-limit.spec.js
// It is deliberately skipped in a normal full-suite run.
//
// Gotcha: playwright.config.js sets reuseExistingServer: true, so if a `next dev`
// process from an earlier run is still listening on :3000, Playwright reuses it as-is
// instead of spawning a new one -- and that stale process never saw this run's
// RATE_LIMIT_FORCE_ENABLED (env vars don't retroactively reach an already-running
// child). If this test fails to trip the limiter at all, kill whatever is on :3000
// first, then rerun.

test.describe('Login rate limiting (opt-in, isolated)', () => {
  test.skip(
    process.env.RATE_LIMIT_FORCE_ENABLED !== 'true',
    'Set RATE_LIMIT_FORCE_ENABLED=true and run this file in isolation to exercise IP-keyed rate limiting.'
  );

  let redis;

  test.beforeAll(async () => {
    redis = Redis.fromEnv();
    const keys = await redis.keys('graceway:ratelimit:login:*');
    if (keys.length) await redis.del(...keys);
  });

  test.afterAll(async () => {
    const keys = await redis.keys('graceway:ratelimit:login:*');
    if (keys.length) await redis.del(...keys);
  });

  test('the 11th rapid login attempt from the same IP is rate-limited', async ({ page }) => {
    await page.goto('/login');

    for (let i = 0; i < 10; i++) {
      await page.locator('input[name="email"]').fill('ratelimit-check@test.graceway.com');
      await page.locator('input[name="password"]').fill('WrongPassword123!');
      await page.getByRole('button', { name: 'Sign In' }).click();
      // LoginForm shows the same error text twice (an inline banner + a toast) — scope to
      // the inline banner only, or getByText() hits a strict-mode ambiguity error.
      await expect(page.locator('div.bg-red-50', { hasText: /Invalid login credentials|Too many attempts/i })).toBeVisible();
    }

    await page.locator('input[name="email"]').fill('ratelimit-check@test.graceway.com');
    await page.locator('input[name="password"]').fill('WrongPassword123!');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.locator('div.bg-red-50', { hasText: 'Too many attempts' })).toBeVisible();
  });
});
