const { test, expect } = require('@playwright/test');

// These routes were deleted as dead/insecure code:
// - /api/certificates/generate: raw insert into `certificates`, already blocked by
//   migration 003's `WITH CHECK (false)` INSERT policy; superseded by the server action path.
// - /api/webhooks: unauthenticated, no signature verification, nothing calls it.
// Guard against regression by asserting both now 404.
test.describe('Deleted API routes', () => {
  test('/api/certificates/generate no longer exists', async ({ request }) => {
    const res = await request.post('/api/certificates/generate', { data: {} });
    expect(res.status()).toBe(404);
  });

  test('/api/webhooks no longer exists', async ({ request }) => {
    const res = await request.post('/api/webhooks', { data: {} });
    expect(res.status()).toBe(404);
  });
});
