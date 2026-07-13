# Go-live checklist

Compiled at the end of Sprint 4, from the actual work done across Sprints 0-4 (not aspirational — every "done" item below was verified with a real test run or a direct check in this repo's history, per this project's own honesty rule in `docs/TESTING.md`). Organized by blocking severity: **must fix before real users**, **should fix soon**, **known and accepted for now**.

## 🔴 Must fix before real users touch this

- [ ] **There is no live production deployment.** `NEXT_PUBLIC_APP_URL` (`https://graceway-platform.vercel.app`) currently returns `DEPLOYMENT_NOT_FOUND` from Vercel — confirmed directly via `curl` during Sprint 4. Nothing in Sprints 0-4 touched deployment; the entire test suite runs against `next dev`/`next start` locally plus the real Supabase project, never against a real hosted instance. Deploy to Vercel and confirm the domain resolves before anything else on this list matters.
- [ ] **Verify the Resend "from" domain.** CLAUDE.md known bug #19, never addressed in any sprint this cycle: if the sending domain isn't verified in Resend, every transactional email (welcome email, certificate email, password reset) silently fails. Check the Resend dashboard for domain verification status before launch — a student who "signs up" but never gets a confirmation email, or a leader who never finds out their team member is stuck, is a real support fire.
- [ ] **Check Supabase's own built-in Auth rate limits before any real concurrent-login event.** Sprint 4's load test (50 simulated concurrent logins) found **38% failed with "Request rate limit reached"** — this is Supabase's own default per-IP sign-in throttle, separate from and in addition to the app's own Upstash-based rate limiting (Sprint 3). If a real cohort logs in from a shared IP (a church/youth-group building's wifi, common for this product's actual use case), the same thing will happen to real users. Check **Supabase Dashboard → Authentication → Rate Limits** and raise the sign-in limit (may require a paid plan) before any live event where many people log in from one location at once.
- [ ] **`npm run lint` cannot run non-interactively.** No `.eslintrc*`/`eslint.config.*` exists in the repo; `next lint` drops into a first-run setup wizard. This has been flagged as a gap in every sprint's agent reports since Sprint 0 and never resolved — CLAUDE.md's own Definition of Done requires "lint clean," and that's currently unverifiable. Run `next lint` interactively once (or commit a config directly) to close this.

## 🟡 Should fix soon (not blocking a soft/limited launch, but real gaps)

- [ ] **Primary button color fails WCAG AA contrast** (`docs/ACCESSIBILITY_LIGHTHOUSE.md`, finding #4) — the default orange button variant measures ~2.8:1 against white text, need 4.5:1. Affects most primary CTAs sitewide (login/signup submit, etc.). Needs a design decision (darken button-background orange specifically, or switch button text color), not a unilateral code fix.
- [ ] **Authenticated pages have never had a Lighthouse/accessibility pass.** Dashboard, course detail, quiz-taking, admin panel, certificate view — exactly where real users spend the most time — were skipped in Sprint 4's audit because Lighthouse's CLI doesn't handle login out of the box. Worth a follow-up pass using Lighthouse's User Flows API with a pre-authenticated session.
- [ ] **No manual accessibility pass** (keyboard-only navigation, screen reader spot-check, focus order/trapping in modals). Lighthouse's automated accessibility audit catches a minority of real WCAG issues by its own documentation's admission.
- [ ] **Backup/PITR is not enabled**, and even once it is, **no practice restore has been performed** (`docs/BACKUP_RESTORE.md`). A restore procedure that's never been run is not a tested procedure — do one practice restore into a throwaway project before trusting this under real pressure.
- [ ] **Error tracking (Sentry) was explicitly deferred** in Sprint 3 — there is currently no automated visibility into production errors. For 200 users this is manageable manually for a while, but the gap should be closed before it's needed most (i.e. right after launch, when the most edge cases surface).
- [ ] **No staging environment.** Also explicitly deferred (Sprint 4 scoping decision) — every change in this entire project has been tested against the single real Supabase project, justified by "no live users yet." That justification expires the moment real users exist; plan the staging split before the next major change lands post-launch.

## 🟢 Known limitations, accepted for now (documented, not forgotten)

- **`quiz-attempt-atomicity.spec.js`'s concurrent-submission test is flaky** when run late in the full 53-test Playwright suite under `next dev` (times out ~1-in-3 full runs), but passes reliably in isolation every time, and the underlying atomic-lock mechanism (`submit_quiz_attempt` RPC, migration 005) was independently verified correct via direct concurrent RPC calls outside the test harness. This is `next dev`'s known fragility under sustained sequential load, not a product bug — will likely resolve itself once tests run against a real deployed instance instead of local dev.
- **`getYouTubeVideoId` doesn't validate the domain** — a non-YouTube URL shaped like `example.com/shorts/xxxxxxxxxxx` would still extract a fake "video ID." Pre-existing, low-severity (admin-only input, not user-facing), out of scope for the specific bug (#12) that was fixed.
- **`/join`'s redirect-chain performance hit (Lighthouse: ~73-74) is by design** — it's an intentional short-URL redirect to `/signup?ref=...` for shareable referral links, not a bug.

## ✅ Confirmed done this cycle (Sprints 0-4), with real verification

All of the below were verified with an actual `npx playwright test` run and pasted output at the time, per this project's honesty rule — not just claimed:

- **Learning loop closes end-to-end**: enroll → complete lessons → 100% → certificate issued exactly once even under concurrent completion (migration 003's partial unique index + `issue_certificate` RPC).
- **Quiz attempts are atomic**: `max_attempts` enforced under a real concurrent double-submit via an advisory-lock Postgres function (migration 005), plus enrollment/published gates.
- **`profiles` RLS tightened**: self/admin/ancestor-leader only (migration 004), was previously world-readable including email/phone. Public certificate sharing and pre-auth referral-code lookup preserved via two narrow `SECURITY DEFINER` RPCs that never expose email.
- **11 previously-unguarded admin mutation actions** (`courses.js`/`lessons.js`/`quizzes.js`) now have `ensureAdmin()` checks, on top of the RLS policies that were already there.
- **Two unauthenticated/dead API routes deleted** (`/api/certificates/generate`, `/api/webhooks`).
- **Rate limiting added** on login, signup, and quiz submission via Upstash Redis (production-only for the IP-keyed limiters, since `next dev` has no reverse proxy to key on).
- **Route boundaries** (`loading.js`/`error.js`/`not-found.js`) added at root and all three route groups.
- **Ordering fixed end-to-end** (`getCourse`, `ModuleList`, all 4 admin forms + their actions).
- **`params`/`searchParams` awaited** everywhere found across the whole app (5 separate pages fixed across Sprints 1, 3, and 4 — each sprint found one more that a prior sprint's fix missed; this pattern suggests it's worth a final repo-wide grep before launch, see below).
- **Full admin CRUD journey tested** (create/edit/delete for course/module/section/lesson/quiz+questions) plus the certificate-blocks-deletion behavior from migration 003, actually exercised for the first time — caught and fixed a real bug (`updateSection` writing to a non-existent column) that had silently broken section editing since it was introduced.
- **~53 Playwright tests** across 10 spec files covering auth, the full learning loop, admin CRUD, security/privacy, quiz atomicity, ordering, profile tabs, route boundaries, and deleted routes.

## Final grep sweep — run, came back clean

Given `params`/`searchParams`-not-awaited bugs were found and fixed **four separate times** across four different sprints (each time in a *different* file a prior sprint's targeted fix didn't cover), a repo-wide sweep was run rather than assuming Sprint 4 found the last one:
```
grep -rn "params\." src/app --include="*.js" --include="*.jsx" | grep -v "await params\|const {.*} = params"
grep -rn "searchParams\." src/app --include="*.js" --include="*.jsx" | grep -v "await searchParams\|const {.*} = searchParams"
```
Result: zero remaining unawaited `params.` usages. Two `searchParams.` hits, both confirmed as correct, unrelated patterns — not bugs: `src/app/api/auth/callback/route.js` derives `searchParams` synchronously from `new URL(request.url)` (a Route Handler, not a page component, so the Promise-based rule doesn't apply), and `src/app/(dashboard)/profile/page.js` uses the client-side `useSearchParams()` hook (`'use client'`), which is also synchronous by design, not the server-side Promise prop. This class of bug is closed across the whole app as of Sprint 4.
