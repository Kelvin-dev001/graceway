const { test, expect } = require('@playwright/test');

// Inputs targeted by name attribute — Input.jsx's <label> has no htmlFor/id, so getByLabel can't resolve them.
const STUDENT = { email: 'student@test.graceway.com', password: 'TestPass123!' };
const ADMIN = { email: 'admin@test.graceway.com', password: 'TestPass123!' };

async function login(page, { email, password }) {
  await page.goto('/login');
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
}

test.describe('Auth & role-based redirects', () => {
  test('admin login redirects to /admin', async ({ page }) => {
    await login(page, ADMIN);

    await expect(page).toHaveURL(/\/admin/);
  });

  test('student login redirects to /dashboard', async ({ page }) => {
    await login(page, STUDENT);

    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('unauthenticated visit to /dashboard redirects to /login', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page).toHaveURL(/\/login/);
    expect(new URL(page.url()).pathname).toBe('/login');
  });

  test('student is blocked from /admin and pushed to /dashboard', async ({ page }) => {
    await login(page, STUDENT);
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto('/admin');

    await expect(page).toHaveURL(/\/dashboard/);
    expect(new URL(page.url()).pathname).toBe('/dashboard');
  });
});
