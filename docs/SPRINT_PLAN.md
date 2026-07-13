# Sprint plan & architecture — Graceway → 200 users

Ordered to your priority ranking: learning loop → security/correctness → tests/CI → mobile. One-week sprints assumed; compress if you're full-time.

## Sprint 0 — Make work testable (2–3 days)
- Stand up the test Supabase project + seed script (`docs/TESTING.md`).
- Add Playwright, write **one** smoke test (login redirect by role) so CI has something to run.
- Add GitHub Actions: `lint` + `build` + `playwright` on every PR.
- Verify the Resend "from" domain (mail silently fails until you do).

Exit: CI is green on a trivial test; a broken build can't merge.

## Sprint 1 — Close the learning loop (priority 1)
- Migration: unique constraints `certificates(user_id, course_id)` and `(user_id, module_id)`; decide cert-vs-course delete behavior.
- New action `recomputeCourseCompletion(userId, courseId)`: uses `getCourseProgressMap`, updates `enrollments.progress_percentage` + `status`, and at 100% (plus required exam passed) issues the certificate idempotently.
- Call it from `markLessonComplete` and from `submitQuizAttempt` when an exam passes.
- Sort all nested selects by `order_index`; add an order field to admin forms; fix `ModuleList` numbering.
- Tests: the full enroll→complete→cert journey, including the run-twice-get-one-cert assertion.

## Sprint 2 — Security & data correctness (priority 2)
- Migration: tighten `profiles` SELECT (self / admin / ancestor leader); keep certs shareable but stop joining recipient email.
- Fix `referred_by`-by-code bugs in `profile/page.js`; switch the tree tab to the `get_discipleship_tree` RPC.
- Await `params` in the three offending pages.
- Add `ensureAdmin`-style guards to `courses.js`/`lessons.js`/`quizzes.js`.
- Move attempt-limit enforcement into a Postgres function (row lock); validate scores/timing server-side.
- Lock down or delete `/api/certificates/generate` and `/api/webhooks`.
- Tests: privacy (can't read others' email), attempt-limit race, role guards.

## Sprint 3 — Robustness & ops (priority 3)
- `loading.js` / `error.js` / `not-found.js` on key routes.
- Fix `ExamTimer` double-submit, `useAuth` unmount guard, `getYouTubeVideoId` shorts.
- Add rate limiting (Upstash or Vercel) on auth + quiz submit.
- Error tracking (Sentry) + structured logging; replace the webhook console.log.
- Switch serverless DB access to the Supabase pooler connection string.
- Expand Playwright to the full critical-journey set; aim for green on all.

## Sprint 4 — Launch hardening for 200 users
- Load-shape check: simulate a spiky cohort login (e.g. 50 concurrent) against the test project; watch Postgres connection count and p95 latency.
- Backups/PITR enabled; document a restore.
- Run an accessibility + Lighthouse pass on the main flows.
- Staging environment that mirrors prod; a go-live checklist.

## Later — Mobile (only once the above is stable)
- Start with **Capacitor** wrapping the web app to validate demand cheaply.
- Before native, identify logic locked inside server actions (not callable from native) and expose it as route handlers/RPCs with a stable contract.
- Plan deep links for email-confirm and password-reset redirects.

## Architecture to introduce for 200 users
- **Connection pooling**: Supabase pooler (PgBouncer, transaction mode) for all serverless DB access — the single most important scaling change.
- **Idempotency + DB-enforced invariants**: unique constraints and SECURITY DEFINER functions instead of read-then-write in app code.
- **Caching discipline**: keep per-user pages dynamic; cache only truly public, static content (published course catalog) and revalidate on admin edits.
- **Observability**: Sentry + Supabase logs + a simple uptime check. You can't operate 200 users blind.
- **CI gates**: lint + build + e2e required to merge; no direct pushes to main.
- **Environments**: separate dev / test / staging / prod Supabase projects; never test against prod.

## A caution worth stating
"200 users" is a small load technically — the risk is not raw scale, it's the correctness and privacy bugs above going live. Spend the effort there, not on premature scaling infrastructure.
