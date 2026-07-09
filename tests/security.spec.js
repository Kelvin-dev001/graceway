const { test, expect } = require('@playwright/test');
const { loadEnvLocal } = require('./helpers/env');

// This is a Node test process, not `next dev`, so .env.local is not auto-loaded.
loadEnvLocal();

const { createClient } = require('@supabase/supabase-js');

// Covers Sprint 2's security/data-correctness fixes:
//   A. profiles RLS tightened to self / admin / ancestor-leader (migration 004,
//      can_view_profile()).
//   B. Public certificate page goes through get_public_certificate() RPC + .maybeSingle()
//      and never exposes the recipient's email.
//   C. Signup referral lookup goes through get_referrer_by_code() RPC (anon-callable) now
//      that profiles isn't world-readable.
//   D. Admin-only writes (courses, etc.) are guarded both by ensureAdmin() in the server
//      action and by RLS underneath it.
//
// tests/quiz-attempt-atomicity.spec.js and tests/deleted-routes.spec.js already cover
// migration 005 and the two deleted API routes respectively -- not duplicated here.

const STUDENT = { email: 'student@test.graceway.com', password: 'TestPass123!' };
const LEADER = { email: 'leader@test.graceway.com', password: 'TestPass123!' };
const ADMIN = { email: 'admin@test.graceway.com', password: 'TestPass123!' };

const FIXTURE_SLUG = 'qa-security-cert-course';
const FIXTURE_COURSE_TITLE = 'QA Security Cert Course';

function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function createAnonClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Signs in with a fresh anon-key client via supabase-js directly (no browser needed) --
// gives a real RLS-bound session for asserting DB-level access control straight from Node.
async function signInAs({ email, password }) {
  const client = createAnonClient();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return { client, userId: data.user.id };
}

// Inputs targeted by name attribute — Input.jsx's <label> has no htmlFor/id, so getByLabel can't resolve them.
async function login(page, { email, password }) {
  await page.goto('/login');
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page).toHaveURL(/\/(dashboard|admin)/);
  await page.waitForLoadState('networkidle');
}

let admin;
let studentId;
let leaderId;
let adminId;
let fixture = {};

test.describe.serial('Security & data correctness (Sprint 2)', () => {
  test.beforeAll(async () => {
    admin = createAdminClient();

    const { data: profiles, error: profilesError } = await admin
      .from('profiles')
      .select('id, email, referred_by, referral_path, referral_code')
      .in('email', [STUDENT.email, LEADER.email, ADMIN.email]);
    if (profilesError) throw profilesError;

    const studentProfile = profiles.find((p) => p.email === STUDENT.email);
    const leaderProfile = profiles.find((p) => p.email === LEADER.email);
    const adminProfile = profiles.find((p) => p.email === ADMIN.email);

    if (!studentProfile || !leaderProfile || !adminProfile) {
      throw new Error(
        'Seeded test accounts not found in profiles. Run scripts/seed-test-users.js against this project first.'
      );
    }

    studentId = studentProfile.id;
    leaderId = leaderProfile.id;
    adminId = adminProfile.id;

    // Sanity-check (via service role, bypassing RLS) that student and leader are NOT in
    // an ancestor/descendant relationship in the referral tree, i.e. they are a genuinely
    // unrelated pair -- each seeded account was created with its own root referral_path
    // and null referred_by, so this should always hold, but assert it rather than assume
    // it in case seeding ever changes.
    const studentIsAncestorOfLeader = leaderProfile.referral_path.startsWith(studentProfile.referral_path);
    const leaderIsAncestorOfStudent = studentProfile.referral_path.startsWith(leaderProfile.referral_path);
    if (studentIsAncestorOfLeader || leaderIsAncestorOfStudent) {
      throw new Error(
        'Seeded student/leader accounts are in an ancestor relationship -- pick a different unrelated pair for the RLS-block assertion.'
      );
    }

    // --- Reset + create a small fixture course for the certificate-page tests: 1
    // published course, 1 published module, 1 published section, 1 published lesson, no
    // exam -- deliberately smaller than learning-loop.spec.js's fixture since all we need
    // here is a real certId, not full progress-bar coverage (that's already tested there).
    const { data: existingCourse, error: existingCourseError } = await admin
      .from('courses')
      .select('id')
      .eq('slug', FIXTURE_SLUG)
      .maybeSingle();
    if (existingCourseError) throw existingCourseError;

    if (existingCourse) {
      const existingCourseId = existingCourse.id;
      await admin.from('certificates').delete().eq('course_id', existingCourseId);
      await admin.from('enrollments').delete().eq('course_id', existingCourseId);
      // Cascades sections, lessons, lesson_progress per the FK chain in 001_initial_schema.sql.
      await admin.from('modules').delete().eq('course_id', existingCourseId);
      const { error: courseDeleteError } = await admin.from('courses').delete().eq('id', existingCourseId);
      if (courseDeleteError) throw courseDeleteError;
    }

    const { data: course, error: courseError } = await admin
      .from('courses')
      .insert({
        title: FIXTURE_COURSE_TITLE,
        slug: FIXTURE_SLUG,
        description: 'Playwright fixture course for the security suite. Safe to reset/delete.',
        is_published: true,
        order_index: 9002,
      })
      .select()
      .single();
    if (courseError) throw courseError;

    const { data: module, error: moduleError } = await admin
      .from('modules')
      .insert({ course_id: course.id, title: 'QA Security Module', order_index: 0, is_published: true })
      .select()
      .single();
    if (moduleError) throw moduleError;

    const { data: section, error: sectionError } = await admin
      .from('sections')
      .insert({ module_id: module.id, title: 'QA Security Section', order_index: 0 })
      .select()
      .single();
    if (sectionError) throw sectionError;

    const { data: lesson, error: lessonError } = await admin
      .from('lessons')
      .insert({
        section_id: section.id,
        module_id: module.id,
        title: 'QA Security Lesson',
        slug: 'qa-security-lesson',
        content: 'Fixture lesson content for the automated security suite.',
        order_index: 0,
        is_published: true,
      })
      .select()
      .single();
    if (lessonError) throw lessonError;

    fixture = { courseId: course.id, courseTitle: FIXTURE_COURSE_TITLE, lessonId: lesson.id };
  });

  test.afterAll(async () => {
    // Belt-and-suspenders cleanup for anything test D might have left behind if an
    // assertion failed mid-test before its own cleanup ran.
    await admin.from('courses').delete().eq('slug', 'qa-security-admin-guard-probe');
  });

  // --- A. profiles RLS (migration 004) ------------------------------------------------

  test('A1. an unrelated non-admin user cannot read another user\'s profile row', async () => {
    const { client: studentClient } = await signInAs(STUDENT);

    const { data, error } = await studentClient
      .from('profiles')
      .select('email')
      .eq('id', leaderId)
      .maybeSingle();

    // RLS blocks the row rather than erroring -- PostgREST just returns no rows.
    expect(error).toBeNull();
    expect(data).toBeNull();
  });

  test('A2. a user can always read their own full profile row', async () => {
    const { client: studentClient } = await signInAs(STUDENT);

    const { data, error } = await studentClient
      .from('profiles')
      .select('id, email, phone')
      .eq('id', studentId)
      .maybeSingle();

    expect(error).toBeNull();
    expect(data?.id).toBe(studentId);
    expect(data?.email).toBe(STUDENT.email);
  });

  test('A3. leader-can-view-descendant is not exercised: no ancestor relationship exists among the 3 seeded accounts', async () => {
    // Confirmed in beforeAll via service-role client: student, leader, and admin were all
    // seeded as independent referral roots (referred_by = null, referral_path = their own
    // id). None is an ancestor of another, so there is no genuine leader->descendant pair
    // to assert "leader CAN read" against without fabricating a new referral relationship,
    // which the task instructions say to avoid ("skip ... rather than inventing a fragile
    // new referral relationship"). can_view_profile()'s ancestor-leader branch is exercised
    // indirectly by the profile-tabs / referral-tree tests elsewhere in this suite; this
    // test exists as a documented, intentional skip rather than silent missing coverage.
    test.skip(true, 'No leader-descendant relationship among seeded accounts -- see comment.');
  });

  // --- B. public certificate page --------------------------------------------------

  test('B4. a different (non-owner, non-admin) authenticated user sees the real recipient name and course title, but never the recipient email', async ({ page, browser }) => {
    // This test packs several first-hit navigations into one dev-server process (login,
    // /courses/:id, /lessons/:id, a second login, /certificates/:certId) -- each is a cold
    // `next dev` compile the first time it's hit in a run of this file alone. Give the
    // whole test more headroom than the 60s default rather than fighting it assertion by
    // assertion (test-infra accommodation, not a product concern -- see also the per-step
    // timeout bumps below and playwright.config.js's own comments on this exact issue).
    test.setTimeout(120000);

    // Enroll + complete as the student to get a real certId (relies on the already-fixed
    // learning-loop completion logic covered end-to-end in learning-loop.spec.js).
    await login(page, STUDENT);
    await page.goto(`/courses/${fixture.courseId}`);
    await page.getByRole('button', { name: 'Enroll Now — Free' }).click();
    await page.waitForLoadState('networkidle');

    await page.goto(`/lessons/${fixture.lessonId}`);
    await expect(page.getByRole('button', { name: 'Mark as Complete' })).toBeVisible({ timeout: 30000 });
    await page.getByRole('button', { name: 'Mark as Complete' }).click();
    // The mark-complete server action can be this run's first-ever invocation of that
    // action module -- cold-compiling it can take noticeably longer than a normal
    // click-to-response round trip, hence the generous timeout instead of the 15s default.
    await expect(page.getByText('Lesson Completed!')).toBeVisible({ timeout: 30000 });

    const { data: cert, error } = await admin
      .from('certificates')
      .select('id')
      .eq('user_id', studentId)
      .eq('course_id', fixture.courseId)
      .maybeSingle();
    expect(error).toBeNull();
    expect(cert).not.toBeNull();
    fixture.certId = cert.id;

    const { data: studentProfile, error: studentProfileError } = await admin
      .from('profiles')
      .select('name')
      .eq('id', studentId)
      .single();
    expect(studentProfileError).toBeNull();

    // NOTE: the task spec asked for a genuinely UNAUTHENTICATED context here. That's not
    // reachable: middleware.js's `protectedRoutes` list includes '/certificates', and the
    // (dashboard) group layout (src/app/(dashboard)/layout.js) unconditionally
    // `redirect('/login')`s when there's no session -- both apply to
    // /certificates/[certId], despite migration 004's own comment explicitly saying this
    // is meant to stay a public share link ("certId is the credential, like a certificate
    // number") and granting get_public_certificate() to `anon`. Verified directly: an
    // anonymous newContext() visit to this URL renders the /login page, not the
    // certificate. That is a REAL, PRE-EXISTING PRODUCT BUG (routing/middleware layer,
    // not something migration 004's RLS/RPC change touches or could have fixed) -- see the
    // B4-known-bug test below, which documents it instead of silently passing over it.
    //
    // What CAN be verified here, and is the actual regression this task is guarding
    // against, is the get_public_certificate() + .maybeSingle() fix itself: any
    // authenticated user who is NOT the cert's owner and NOT an admin (the leader account)
    // reaches this page fine (leader has a session, so both gates above let it through)
    // and must see the RPC-resolved public fields -- proving the SECURITY DEFINER RPC,
    // not certificates' owner-or-admin RLS, is what's serving this page.
    const leaderContext = await browser.newContext();
    try {
      const leaderPage = await leaderContext.newPage();
      await login(leaderPage, LEADER);

      const response = await leaderPage.goto(`/certificates/${fixture.certId}`);
      expect(response.status()).toBeLessThan(400);

      // Test-infra note (not a product bug): this test's preceding steps (student login,
      // /courses/:id, /lessons/:id) are themselves first-hits against a freshly-spawned
      // `next dev` webServer, and stacking several fresh dev-compiles immediately before
      // this navigation has been observed to occasionally serve a transient default
      // not-found boundary that self-heals on reload a moment later (matches the same
      // "next dev cold-compiles each route on first hit" characteristic already called out
      // in playwright.config.js). Guard with a bounded reload-retry rather than a longer
      // flat timeout, so a REAL regression (permanently blank/wrong content) still fails.
      await expect(async () => {
        const heading = leaderPage.getByRole('heading', { name: fixture.courseTitle });
        if (!(await heading.isVisible().catch(() => false))) {
          await leaderPage.reload();
        }
        await expect(heading).toBeVisible({ timeout: 5000 });
      }).toPass({ timeout: 30000 });

      await expect(leaderPage.getByText(studentProfile.name, { exact: true })).toBeVisible();
      await expect(leaderPage.getByRole('heading', { name: fixture.courseTitle })).toBeVisible();

      // Deliberately check rendered/visible text (innerText), not the raw HTML document.
      // page.content() includes Next's inline RSC "flight" <script> payloads, which can
      // accumulate serialized data from earlier streamed/superseded states (e.g. the
      // reload-retry above) as well as the current viewer's OWN session data (leader's own
      // email legitimately appears in the account-menu markup) -- neither is the thing
      // under test. The actual security property is "the recipient's email is not exposed
      // to a non-owner viewer", so assert against what's actually rendered and scope the
      // check to the recipient's email specifically rather than a blanket email-shaped
      // regex (which would false-positive on the viewer's own email in the nav header).
      const visibleText = await leaderPage.locator('body').innerText();
      expect(visibleText).not.toContain(STUDENT.email);
    } finally {
      await leaderContext.close();
    }
  });

  test('B4-known-bug. DOCUMENTS (does not fix) that an unauthenticated visitor is currently redirected to /login instead of seeing the public certificate', async ({ browser }) => {
    // See the long comment in B4 above for the full diagnosis. This test exists so the
    // gap is visible in CI output (a named, explained assertion) rather than silently
    // absent from coverage. If a future change fixes the routing/middleware gate to allow
    // truly public certificate viewing, THIS TEST SHOULD FAIL and should be rewritten to
    // assert the fixed (public) behavior, deleting this bug-documentation test.
    const anonContext = await browser.newContext();
    try {
      const anonPage = await anonContext.newPage();
      await anonPage.goto(`/certificates/${fixture.certId}`);
      await expect(anonPage).toHaveURL(/\/login/);
    } finally {
      await anonContext.close();
    }
  });

  test('B5. a nonexistent certId redirects to /certificates (when the viewer is authenticated, since anonymous access is itself gated -- see B4-known-bug)', async ({ page }) => {
    await login(page, STUDENT);
    await page.goto('/certificates/00000000-0000-0000-0000-000000000000');
    await expect(page).toHaveURL(/\/certificates$/);
  });

  // --- C. signup referral code (get_referrer_by_code RPC) -----------------------------

  test('C6. get_referrer_by_code resolves a valid code for an anonymous (pre-auth) caller, without exposing email', async () => {
    const { data: studentProfile } = await admin
      .from('profiles')
      .select('referral_code, name')
      .eq('id', studentId)
      .single();

    const anon = createAnonClient(); // no signInWithPassword -- this is the pre-auth path.
    const { data, error } = await anon.rpc('get_referrer_by_code', { p_code: studentProfile.referral_code });

    expect(error).toBeNull();
    // RETURNS TABLE -> array from a bare .rpc() call (same shape validateReferralCode()
    // destructures via data?.[0] in src/actions/referrals.js).
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(1);
    expect(data[0].id).toBe(studentId);
    expect(data[0].referral_code).toBe(studentProfile.referral_code);
    // The RPC's RETURNS TABLE is (id, name, referral_code) only -- no email/phone column
    // exists on the row at all, so there is nothing to leak by construction. Confirm that
    // contract directly rather than just checking the row shape.
    expect(Object.keys(data[0]).sort()).toEqual(['id', 'name', 'referral_code'].sort());
  });

  test('C6b. an invalid referral code resolves to no rows', async () => {
    const anon = createAnonClient();
    const { data, error } = await anon.rpc('get_referrer_by_code', { p_code: 'not-a-real-code' });
    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });

  test('C6c. /signup?ref=<valid code> renders for an anonymous visitor without erroring', async ({ page }) => {
    const { data: studentProfile } = await admin
      .from('profiles')
      .select('referral_code')
      .eq('id', studentId)
      .single();

    // SignupForm.jsx reads `ref` straight from the query string and displays it -- it does
    // not itself call validateReferralCode()/get_referrer_by_code() (that action has no
    // caller in the current UI). This is a light smoke check that the page still renders
    // correctly with a real code post-migration-004; the RPC contract itself is asserted
    // directly against the DB in C6/C6b above.
    await page.goto(`/signup?ref=${studentProfile.referral_code}`);
    await expect(page.getByText(studentProfile.referral_code)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Join Graceway' })).toBeVisible();
  });

  // --- D. admin-only writes: RLS as the underlying enforcement behind ensureAdmin() ---

  test('D7a. a non-admin authenticated client is rejected by RLS when inserting a course directly', async () => {
    const { client: studentClient } = await signInAs(STUDENT);

    const { data, error } = await studentClient
      .from('courses')
      .insert({
        title: 'Should Not Be Created',
        slug: 'qa-security-admin-guard-probe-student',
        is_published: false,
        order_index: 9999,
      })
      .select();

    expect(error).not.toBeNull();
    expect(data).toBeNull();

    // Belt and suspenders: confirm nothing landed regardless of how the client reported it.
    const { data: leaked } = await admin
      .from('courses')
      .select('id')
      .eq('slug', 'qa-security-admin-guard-probe-student')
      .maybeSingle();
    expect(leaked).toBeNull();
  });

  test('D7b. an admin authenticated client CAN insert a course directly (regression check), then it is cleaned up', async () => {
    const { client: adminClient } = await signInAs(ADMIN);

    const { data, error } = await adminClient
      .from('courses')
      .insert({
        title: 'QA Security Admin Guard Probe',
        slug: 'qa-security-admin-guard-probe',
        is_published: false,
        order_index: 9999,
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data?.id).toBeTruthy();

    const { error: deleteError } = await admin.from('courses').delete().eq('id', data.id);
    expect(deleteError).toBeNull();
  });

  test('D7c. middleware blocks a student from the admin course-creation page', async ({ page }) => {
    // tests/auth.spec.js already covers the general student-blocked-from-/admin redirect
    // exhaustively; this just confirms the same guard extends to a concrete admin write
    // surface (course creation) rather than only the /admin index route.
    await login(page, STUDENT);
    await page.goto('/admin/courses/new');
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
