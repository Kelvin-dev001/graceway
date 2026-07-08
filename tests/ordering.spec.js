const { test, expect } = require('@playwright/test');

// Inputs targeted by name attribute — Input.jsx's <label> has no htmlFor/id, so getByLabel can't resolve them.
const ADMIN = { email: 'admin@test.graceway.com', password: 'TestPass123!' };

async function login(page, { email, password }) {
  await page.goto('/login');
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
}

test.describe('Admin ordering fields (Sprint 1 Task 4, Part C)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN);
    await expect(page).toHaveURL(/\/admin/);
  });

  test('course form exposes a numeric Order field', async ({ page }) => {
    await page.goto('/admin/courses/new');
    const orderInput = page.locator('input[name="order_index"]');
    await expect(orderInput).toBeVisible();
    await expect(orderInput).toHaveAttribute('type', 'number');
  });

  test('module form exposes a numeric Order field', async ({ page }) => {
    await page.goto('/admin/modules/new');
    const orderInput = page.locator('input[name="order_index"]');
    await expect(orderInput).toBeVisible();
    await expect(orderInput).toHaveAttribute('type', 'number');
  });

  test('section form exposes a numeric Order field', async ({ page }) => {
    await page.goto('/admin/sections/new');
    const orderInput = page.locator('input[name="order_index"]');
    await expect(orderInput).toBeVisible();
    await expect(orderInput).toHaveAttribute('type', 'number');
  });

  test('lesson form exposes a numeric Order field', async ({ page }) => {
    await page.goto('/admin/lessons/new');
    const orderInput = page.locator('input[name="order_index"]');
    await expect(orderInput).toBeVisible();
    await expect(orderInput).toHaveAttribute('type', 'number');
  });
});
