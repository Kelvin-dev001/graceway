const { test, expect } = require('@playwright/test');

// Covers Sprint 3 Task 1: root and (admin) not-found.js boundaries.
//
// error.js boundaries are NOT covered here -- they'd require a fault-injection seam
// (forcing a server component to throw) that doesn't exist in this codebase today.
// Out of scope for this task; documented here rather than silently skipped.

// Inputs targeted by name attribute — Input.jsx's <label> has no htmlFor/id, so getByLabel can't resolve them.
const ADMIN = { email: 'admin@test.graceway.com', password: 'TestPass123!' };

async function login(page, { email, password }) {
  await page.goto('/login');
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
}

test.describe('Route boundaries (Sprint 3)', () => {
  test('a genuinely unmatched path renders the root not-found.js, not Next\'s generic default', async ({ page }) => {
    const response = await page.goto('/this-route-does-not-exist');
    expect(response.status()).toBe(404);

    // Test-infra note (not a product bug): on a cold `next dev` process, the very first
    // hit to /_not-found can transiently render dev-mode's own "missing required error
    // components, refreshing..." placeholder while it finishes compiling, then
    // self-refreshes a moment later (same "first-hit cold compile" characteristic already
    // documented in playwright.config.js and tests/security.spec.js's B4 test). Guard with
    // a bounded reload-retry rather than a longer flat timeout, so a REAL regression
    // (permanently missing not-found.js content) still fails.
    await expect(async () => {
      const heading = page.getByRole('heading', { name: 'Page not found' });
      if (!(await heading.isVisible().catch(() => false))) {
        await page.reload();
      }
      await expect(heading).toBeVisible({ timeout: 5000 });
    }).toPass({ timeout: 30000 });

    await expect(page.getByRole('link', { name: 'Back to Home' })).toBeVisible();
  });

  test('a well-formed but nonexistent module id renders the (admin) not-found.js', async ({ page }) => {
    await login(page, ADMIN);
    await expect(page).toHaveURL(/\/admin/);

    await page.goto('/admin/modules/00000000-0000-0000-0000-000000000000/edit');

    // Same cold-compile guard as above.
    await expect(async () => {
      const heading = page.getByRole('heading', { name: 'Not found' });
      if (!(await heading.isVisible().catch(() => false))) {
        await page.reload();
      }
      await expect(heading).toBeVisible({ timeout: 5000 });
    }).toPass({ timeout: 30000 });

    await expect(page.getByRole('link', { name: 'Back to Admin Dashboard' })).toBeVisible();
  });
});
