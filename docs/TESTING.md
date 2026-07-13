# Testing setup for Graceway

## Why there's setup
There are currently zero tests. This sets up Playwright (e2e) against a **dedicated test Supabase project** — never production.

## One-time setup
1. Create a second Supabase project ("graceway-test"). Apply `supabase/migrations/*` to it.
2. Put its URL/anon/service keys in `.env.test.local`.
3. `npm i -D @playwright/test && npx playwright install`
4. Seed deterministic accounts (student@test, leader@test, admin@test) via a seed script using the service-role client. Email-confirm them programmatically with `auth.admin`.

## Critical journeys to cover (in priority order)
1. **Learning loop**: enroll → open lesson → mark complete → course progress increases → at 100% enrollment flips to completed and a certificate is issued exactly once (run the completion twice, assert one cert).
2. **Quiz**: pass updates state; fail lets you retry; exceeding `max_attempts` is blocked even under two near-simultaneous submits.
3. **Auth & roles**: signup shows verify-email gate; login redirects admin→/admin, others→/dashboard; middleware blocks student from /admin and pushes admin out of /dashboard.
4. **Admin CRUD**: create/edit/delete course, module, section, lesson, quiz (+questions); deletes cascade or block as documented.
5. **Privacy**: as an unrelated student, you cannot read another user's email via profiles; a certificate link is viewable but does not expose the recipient's email.

## Honesty rule
A change is only "tested" if `npx playwright test` actually ran and passed in the session. Paste the real output. A green claim without a run is a defect.
