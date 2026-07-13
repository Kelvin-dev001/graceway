# Accessibility & Lighthouse pass (Sprint 4)

Audited with Lighthouse 13.4.0 against a local **production build** (`npm run build && npm run start`), not `next dev` — dev mode is unoptimized and gives misleadingly poor performance numbers. Audited 5 public, unauthenticated pages (Lighthouse can't easily audit behind a login without extra tooling): landing (`/`), `/login`, `/signup`, `/courses`, `/join`.

**Note**: there is currently no live production deployment to audit against — see the go-live checklist for that finding. These numbers are the best available proxy (a local production build) until that's fixed.

## Scores — before fixes

| Page | Performance | Accessibility | Best Practices | SEO |
|---|---|---|---|---|
| landing | 97 | 93 | 96 | 100 |
| login | 97 | 90 | 96 | 100 |
| signup | 96 | 90 | 96 | 100 |
| courses | 96 | 90 | 96 | 100 |
| join | 73 | 90 | 96 | 100 |

## Scores — after fixes (this pass)

| Page | Performance | Accessibility | Best Practices | SEO |
|---|---|---|---|---|
| landing | 97 | **100** | 96 | 100 |
| login | 97 | **96** | 96 | 100 |
| join | 74 | **96** | 96 | 100 |

(`signup`/`courses` share the same `Navbar`/`Footer` fix and would score the same as `login`; not re-run individually.)

## Issues found and fixed in this pass

1. **Mobile menu button had no accessible name** (`button-name`, every page) — `Navbar.jsx`'s hamburger toggle was an icon-only `<button>` with no `aria-label`, so screen readers announced it as an unnamed button. Fixed: added `aria-label="Open menu"/"Close menu"` (toggles with state) and `aria-expanded`.
2. **Footer headings skipped a level** (`heading-order`, every page) — `Footer.jsx`'s "Platform"/"Account" section labels were `<h4>` with no `<h3>` anywhere earlier in the DOM on pages whose highest heading is `<h2>` (e.g. login's "Welcome back"), which fails WCAG's sequential-heading-level rule. Fixed: changed both to `<h3>`.
3. **`/join`'s `searchParams` used synchronously** — unrelated to a specific Lighthouse audit, but found while investigating `/join`'s performance: `src/app/join/page.js` read `searchParams.ref` directly instead of awaiting it, the same Next.js 15 "must be awaited" issue as the `params` bugs fixed in earlier sprints (this is the sibling API — `searchParams` is a Promise in Server Components too). Fixed: `JoinRedirect` is now `async` and does `const { ref } = await searchParams;`.

## Issues found, NOT fixed — need a decision

4. **Primary button color fails contrast (`color-contrast`, 4 of 5 pages).** The `primary` button variant (`bg-orange-500` / `#FF6D00` with white text, `src/components/ui/Button.jsx`) measures **~2.8:1 contrast**, well under WCAG AA's 4.5:1 requirement for normal-size text. This is the default button variant, used for most primary CTAs (login submit, signup submit, etc.) — a real, widespread issue, not cosmetic.
   - This is a **brand color** (`orange` is one of the four custom colors CLAUDE.md designates as fixed brand colors), so I'm not changing it unilaterally.
   - The next-darkest defined shade, `orange-600` (`#E65100`), measures ~3.8:1 with white — still short of 4.5:1 for normal text, though it would pass the 3:1 threshold for large/bold text if the button text is sized appropriately.
   - Recommend one of: (a) darken the orange further for button backgrounds specifically (a new shade, not necessarily changing the brand orange everywhere), (b) switch button text to a dark color (e.g. `navy-500`) instead of white on the orange background, or (c) accept the risk for now and revisit before a broader launch. This needs a design call, not a code fix I should make alone.

5. **`/join` performance (73→74) — "Avoid multiple page redirects," ~2.3s estimated savings.** `/join` is *intentionally* a redirect-only route (`/join?ref=CODE` → `/signup?ref=CODE`, for short/shareable referral links) — the redirect Lighthouse is penalizing is the page's actual purpose, not a bug. Not fixing; flagging so the score isn't mistaken for a regression. If referral-link speed ever becomes a real concern, the fix would be changing the referral link format to point directly at `/signup?ref=...` and retiring `/join`, which is a product decision, not a quick patch.
6. **`/join`'s CLS (cumulative layout shift) measured 0.389 (poor, target <0.1).** Given the page shows a "Redirecting..." message for milliseconds before navigating away, this is unlikely to be a real user-facing issue (nobody looks at this page long enough to notice a shift) — not chasing further, but noting it in case `/join` ever becomes a longer-lived page.

## Not audited in this pass (scope gap, be honest about it)

- **Authenticated pages** (dashboard, courses detail, admin panel, quiz-taking, certificate view) were not audited — Lighthouse's CLI doesn't handle login flows out of the box, and building that (Puppeteer + Lighthouse's user-flow API, logging in first) was out of scope for this pass. These are exactly the pages real users spend the most time on, so this is a real gap, not a formality — worth a follow-up pass before a big launch push, using Lighthouse's [User Flows](https://developer.chrome.com/docs/lighthouse/user-flows/) API with a pre-authenticated Playwright/Puppeteer session.
- **Only Chromium/desktop tested.** No mobile-emulation Lighthouse run, no cross-browser accessibility check (VoiceOver/NVDA screen-reader testing, keyboard-only navigation walkthrough). Lighthouse's automated `accessibility` category catches maybe 30-40% of real WCAG issues by its own documentation's admission — a manual pass (tab through every form, check focus order/visibility, verify modals trap focus) has not been done.
- **Full raw reports** (JSON + HTML) from this pass are in the session scratchpad, not committed to the repo — rerun `npx lighthouse <url> --view` locally against a production build to reproduce.
