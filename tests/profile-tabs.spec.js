const { test, expect } = require('@playwright/test');

// Inputs targeted by name attribute — Input.jsx's <label> has no htmlFor/id, so getByLabel can't resolve them.
const LEADER = { email: 'leader@test.graceway.com', password: 'TestPass123!' };

async function login(page, { email, password }) {
  await page.goto('/login');
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
}

test.describe('Profile students/tree tabs (referred_by UUID + get_discipleship_tree RPC)', () => {
  test('students tab queries by user id without throwing and renders a result', async ({ page }) => {
    const consoleErrors = [];
    page.on('pageerror', (err) => consoleErrors.push(err.message));

    await login(page, LEADER);
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto('/profile?tab=students');

    // Either referred students render, or the empty state does — either way the
    // query must resolve (previously it filtered referred_by by a referral code,
    // a UUID column, so it silently returned nothing but never crashed; this test
    // guards against a regression that throws instead).
    const emptyState = page.getByText('No referred students yet.');
    const studentCards = page.locator('div.space-y-3 > div.border');
    await expect(emptyState.or(studentCards.first())).toBeVisible();

    expect(consoleErrors).toEqual([]);
  });

  test('tree tab calls get_discipleship_tree RPC without throwing and renders a result', async ({ page }) => {
    const consoleErrors = [];
    page.on('pageerror', (err) => consoleErrors.push(err.message));

    await login(page, LEADER);
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto('/profile?tab=tree');

    const emptyState = page.getByText('No tree data available yet.');
    const treeNodes = page.locator('div.space-y-2 > div.text-gray-700');
    await expect(emptyState.or(treeNodes.first())).toBeVisible();

    expect(consoleErrors).toEqual([]);
  });
});
