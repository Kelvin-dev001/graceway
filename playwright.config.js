const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Several tests do multiple full page navigations against `next dev` (cold route
  // compiles + LoginForm's hard window.location.href navigation), which can add up to
  // well over Playwright's 30s default per-test timeout even when everything is
  // functionally correct. Test-infra fix, not a product bug.
  timeout: 60000,
  // webServer runs `next dev`, not a production build — under concurrent load its
  // single dev process serves inconsistent auth state to parallel workers. Serialize.
  workers: 1,
  reporter: 'list',
  // next dev cold-compiles each route on first hit, and login does a hard
  // `window.location.href` navigation (see LoginForm.jsx) rather than a client-side
  // transition — together these can take 8-10s on a first hit, well past Playwright's
  // 5000ms expect() default. Bumped here (test-infra fix, not a product bug: the app
  // itself responds correctly, just slower than the default timeout under `next dev`).
  expect: {
    timeout: 15000,
  },
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
