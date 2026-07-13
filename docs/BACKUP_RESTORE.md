# Backup & restore runbook

Status as of this writing: **PITR is not yet enabled** on the Graceway Supabase project (Sprint 4 decision: documented here, enabling deferred until closer to launch — see `docs/SPRINT_PLAN.md`). This doc describes how backups work on Supabase and the exact steps to restore, so it's ready to execute the moment PITR (or even just daily backups) is turned on.

## 1. What Supabase actually offers

Supabase's backup tiers (confirm current details against the Dashboard — plan tiers and pricing change, don't trust this doc's specifics blindly):
- **Daily backups**: available on paid plans. A full snapshot once a day, retained for a limited window. Restoring from a daily backup loses up to 24h of data.
- **Point-in-time recovery (PITR)**: available on paid plans, usually as an add-on. Continuously archives WAL (write-ahead log), letting you restore to any specific timestamp within the retention window (commonly 7–28 days depending on plan). This is what you want for a real launch — daily backups alone mean a bad afternoon can cost a full day of signups/progress.

Check current status: **Supabase Dashboard → Project Settings → Database → Backups**. This page shows whether backups are on, what type, and the retention window, and is also where PITR gets enabled.

## 2. Before you need this: what to check periodically

- Confirm backups are actually running (the Backups page lists recent snapshots — an empty list after "enabling" backups means something's wrong, not that you're safe).
- Note the retention window and put a recurring reminder to verify it hasn't silently lapsed (e.g. after a plan downgrade).
- Once PITR is on, do **one practice restore** into a scratch/throwaway Supabase project before you actually need it for real. A restore procedure you've never run is not a tested procedure.

## 3. Restore procedure

### 3a. Dashboard-based restore (the normal path)

1. **Do not restore into the live project if you can avoid it** for anything short of total data loss — a restore replaces the database, which means anything written after your restore point is gone, including any legitimate activity that happened between the incident and the restore. If the incident is localized (e.g. one bad migration, one bad admin action), prefer a targeted SQL fix or a restore into a **new** project to recover the lost rows, then merge back manually, over a full in-place restore.
2. Go to **Project Settings → Database → Backups**.
3. For a daily backup: pick the snapshot, confirm the restore. For PITR: pick the exact timestamp (as close as possible to *just before* the incident, not after — Supabase's PITR UI lets you pick down to the second/minute depending on plan).
4. Supabase provisions the restore. This can take from several minutes to much longer depending on database size — there is real downtime here, the project is not available mid-restore. Warn users if this is a live incident, not a drill.
5. Once restored, the project's connection details (URL, keys) typically stay the same — but **verify** `NEXT_PUBLIC_SUPABASE_URL` and both keys in `.env.local` / Vercel env vars still match after the restore completes, before declaring the incident over.

### 3b. Manual restore via `pg_dump`/`pg_restore` (if you maintain your own periodic exports)

This project does not currently run its own `pg_dump` exports — Supabase's own backup system is the only backup mechanism in place. If that changes (e.g. a nightly `pg_dump` cron added later), the restore path would be:
```
pg_restore --clean --if-exists -d <connection-string> <dump-file>
```
Update this section with the real command and cron location if/when that's added — don't let this doc drift from what's actually running.

## 4. Post-restore verification checklist (Graceway-specific)

A restore is not "done" until you've confirmed the app actually works against the restored data. Check, in this order:

1. **Migrations are all present**: `supabase/migrations/*.sql` should all be reflected in the schema. Spot-check the newest one (currently `005_quiz_attempt_atomic_submit.sql`) — query for `public.submit_quiz_attempt` existing (`select proname from pg_proc where proname = 'submit_quiz_attempt';` via the SQL Editor) as a canary; if it's missing, the restore point predates that migration and needs re-applying manually.
2. **RLS is still enabled on every table.** A restore should preserve this, but verify — `select tablename, rowsecurity from pg_tables where schemaname = 'public';` should show `rowsecurity = true` for every app table. If any show `false`, RLS silently didn't restore correctly and the project is wide open until fixed.
3. **The three known idempotency/security migrations are intact**: certificates' `WITH CHECK (false)` INSERT policy (003), the tightened `profiles` SELECT policy + `can_view_profile`/`get_public_certificate`/`get_referrer_by_code` functions (004), and `quiz_attempts`' `WITH CHECK (false)`/`USING (false)` policies + `submit_quiz_attempt` (005). If the restore point is from before one of these was applied, re-run the relevant migration file manually before reopening the app to users.
4. **Auth and `profiles` are in sync.** `auth.users` and `public.profiles` should have matching row counts (`select count(*) from auth.users;` vs `select count(*) from public.profiles;`) — a mismatch means the `handle_new_user` trigger didn't fire correctly during restore, or manual auth changes happened after the restore point but profile changes didn't (or vice versa).
5. **Smoke test the critical paths for real** (per `docs/TESTING.md`): log in as the seeded admin/student/leader accounts (or real accounts if this is a genuine post-incident restore, in which case use throwaway test accounts instead), confirm a course loads, confirm a certificate renders. Don't declare the incident resolved on "the dashboard looks fine."
6. **Check `RESEND_API_KEY`/email**: if the restore is old enough, check whether any queued/pending email-dependent state (e.g. unconfirmed signups) needs manual follow-up — restored `auth.users` rows may be in an inconsistent confirmation state relative to what users actually experienced.

## 5. Known gaps (be honest about these until closed)

- **No practice restore has been performed.** This runbook is written from Supabase's documented behavior, not verified against this specific project. Do the practice restore (§2) before trusting this document under real pressure.
- **No automated backup-freshness alerting.** Nothing currently pages anyone if backups silently stop. Sprint 3's "error tracking (Sentry) + structured logging" item (deferred) would be the natural place to add this later.
- **Single-project setup.** Per the Sprint 4 scoping decision, there's no staging project to test a restore against without touching the one real project — the practice restore in §2 should go to a **new, throwaway** Supabase project (create one, restore a backup into it, verify, then delete it), not the live one.
