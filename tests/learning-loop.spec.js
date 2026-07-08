const { test, expect } = require('@playwright/test');
const { loadEnvLocal } = require('./helpers/env');

// This is a Node test process, not `next dev`, so .env.local is not auto-loaded.
loadEnvLocal();

const { createClient } = require('@supabase/supabase-js');

const STUDENT = { email: 'student@test.graceway.com', password: 'TestPass123!' };
const LEADER = { email: 'leader@test.graceway.com', password: 'TestPass123!' };

const FIXTURE_SLUG = 'qa-learning-loop-course';
const FIXTURE_COURSE_TITLE = 'QA Learning Loop Course';

function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Inputs targeted by name attribute — Input.jsx's <label> has no htmlFor/id, so getByLabel can't resolve them.
async function login(page, { email, password }) {
  await page.goto('/login');
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  // LoginForm does a hard `window.location.href` navigation after sign-in; give the
  // resulting full page load a moment to settle before the caller navigates again,
  // otherwise a fast next `page.goto()` can race the still-in-flight load and abort it.
  await page.waitForLoadState('networkidle');
}

// The ProgressBar component renders label + percentage as adjacent <span> siblings
// inside the same flex row: <span>{label}</span><span>{percent}%</span>.
function courseProgressPercentLocator(page) {
  return page.locator('span:has-text("Course Progress") + span');
}

let admin;
let studentId;
let leaderId;
let fixture = {};

test.describe.serial('Learning loop: enroll -> complete lessons -> progress -> certificate', () => {
  test.beforeAll(async () => {
    admin = createAdminClient();

    const { data: profiles, error: profilesError } = await admin
      .from('profiles')
      .select('id, email')
      .in('email', [STUDENT.email, LEADER.email]);
    if (profilesError) throw profilesError;

    studentId = profiles.find((p) => p.email === STUDENT.email)?.id;
    leaderId = profiles.find((p) => p.email === LEADER.email)?.id;

    if (!studentId || !leaderId) {
      throw new Error(
        'Seeded test accounts not found in profiles. Run scripts/seed-test-users.js against this project first.'
      );
    }

    // --- Reset: remove any prior fixture course + dependent rows so the suite is
    // rerunnable from a clean slate. Order matters because certificates.course_id has
    // no ON DELETE action (NO ACTION, by design per migration 003) and would block a
    // course delete if left in place.
    const { data: existingCourse, error: existingCourseError } = await admin
      .from('courses')
      .select('id')
      .eq('slug', FIXTURE_SLUG)
      .maybeSingle();
    if (existingCourseError) throw existingCourseError;

    if (existingCourse) {
      const existingCourseId = existingCourse.id;
      const { error: certDeleteError } = await admin
        .from('certificates')
        .delete()
        .eq('course_id', existingCourseId);
      if (certDeleteError) throw certDeleteError;

      const { error: enrollDeleteError } = await admin
        .from('enrollments')
        .delete()
        .eq('course_id', existingCourseId);
      if (enrollDeleteError) throw enrollDeleteError;

      // Cascades sections, lessons, lesson_progress (via lessons), and quizzes/questions
      // (via lessons/modules) per the FK ON DELETE CASCADE chain in 001_initial_schema.sql.
      const { error: moduleDeleteError } = await admin
        .from('modules')
        .delete()
        .eq('course_id', existingCourseId);
      if (moduleDeleteError) throw moduleDeleteError;

      const { error: courseDeleteError } = await admin
        .from('courses')
        .delete()
        .eq('id', existingCourseId);
      if (courseDeleteError) throw courseDeleteError;
    }

    // --- Create a fresh, dedicated fixture course: 1 published course, 1 published
    // module, 1 published section, exactly 2 published lessons, no course_exam quiz.
    const { data: course, error: courseError } = await admin
      .from('courses')
      .insert({
        title: FIXTURE_COURSE_TITLE,
        slug: FIXTURE_SLUG,
        description: 'Playwright fixture course for the learning-loop suite. Safe to reset/delete.',
        is_published: true,
        order_index: 9000,
      })
      .select()
      .single();
    if (courseError) throw courseError;

    const { data: module, error: moduleError } = await admin
      .from('modules')
      .insert({
        course_id: course.id,
        title: 'QA Learning Loop Module',
        order_index: 0,
        is_published: true,
      })
      .select()
      .single();
    if (moduleError) throw moduleError;

    const { data: section, error: sectionError } = await admin
      .from('sections')
      .insert({
        module_id: module.id,
        title: 'QA Learning Loop Section',
        order_index: 0,
      })
      .select()
      .single();
    if (sectionError) throw sectionError;

    const { data: lessons, error: lessonsError } = await admin
      .from('lessons')
      .insert([
        {
          section_id: section.id,
          module_id: module.id,
          title: 'QA Lesson 1',
          slug: 'qa-lesson-1',
          content: 'Fixture lesson 1 content for the automated learning-loop suite.',
          order_index: 0,
          is_published: true,
        },
        {
          section_id: section.id,
          module_id: module.id,
          title: 'QA Lesson 2',
          slug: 'qa-lesson-2',
          content: 'Fixture lesson 2 content for the automated learning-loop suite.',
          order_index: 1,
          is_published: true,
        },
      ])
      .select()
      .order('order_index');
    if (lessonsError) throw lessonsError;

    fixture = {
      courseId: course.id,
      courseTitle: FIXTURE_COURSE_TITLE,
      moduleId: module.id,
      sectionId: section.id,
      lessonIds: lessons.map((l) => l.id),
    };
  });

  test('1. enrolling in the fixture course shows 0% progress', async ({ page }) => {
    await login(page, STUDENT);

    await page.goto(`/courses/${fixture.courseId}`);
    await expect(page.getByRole('button', { name: 'Enroll Now — Free' })).toBeVisible();

    await page.getByRole('button', { name: 'Enroll Now — Free' }).click();
    await page.waitForLoadState('networkidle');
    // Force a fresh SSR fetch rather than relying on Next's implicit post-action
    // refresh timing — the course page is `force-dynamic` so this is always live data.
    await page.goto(`/courses/${fixture.courseId}`);

    await expect(page.getByRole('button', { name: 'Enroll Now — Free' })).not.toBeVisible();
    await expect(page.getByText('Course Progress')).toBeVisible();
    await expect(courseProgressPercentLocator(page)).toHaveText('0%');

    const { data: enrollment, error } = await admin
      .from('enrollments')
      .select('status, progress_percentage')
      .eq('user_id', studentId)
      .eq('course_id', fixture.courseId)
      .single();
    expect(error).toBeNull();
    expect(enrollment.status).toBe('active');
    expect(Number(enrollment.progress_percentage)).toBe(0);
  });

  test('2. completing both lessons reaches 100% and flips the enrollment to completed', async ({ page }) => {
    await login(page, STUDENT);

    for (const lessonId of fixture.lessonIds) {
      await page.goto(`/lessons/${lessonId}`);
      await expect(page.getByRole('button', { name: 'Mark as Complete' })).toBeVisible();
      await page.getByRole('button', { name: 'Mark as Complete' }).click();
      await expect(page.getByText('Lesson Completed!')).toBeVisible();
    }

    // Lighter UI-level sanity check.
    await page.goto(`/courses/${fixture.courseId}`);
    await expect(courseProgressPercentLocator(page)).toHaveText('100%');

    // The actual claim being tested: direct DB assertion.
    const { data: enrollment, error } = await admin
      .from('enrollments')
      .select('status, progress_percentage')
      .eq('user_id', studentId)
      .eq('course_id', fixture.courseId)
      .single();
    expect(error).toBeNull();
    expect(enrollment.status).toBe('completed');
    expect(Number(enrollment.progress_percentage)).toBe(100);
  });

  test('3. a certificate is issued and appears on /certificates', async ({ page }) => {
    await login(page, STUDENT);

    await page.goto('/certificates');
    await expect(page.getByRole('heading', { name: fixture.courseTitle })).toBeVisible();

    const { data: certs, error } = await admin
      .from('certificates')
      .select('id, certificate_number')
      .eq('user_id', studentId)
      .eq('course_id', fixture.courseId);
    expect(error).toBeNull();
    expect(certs).toHaveLength(1);
  });

  test('4. re-issuing the certificate for the same user+course is idempotent', async () => {
    const { data: before, error: beforeError } = await admin
      .from('certificates')
      .select('id, certificate_number')
      .eq('user_id', studentId)
      .eq('course_id', fixture.courseId);
    expect(beforeError).toBeNull();
    expect(before).toHaveLength(1);

    const secondAttemptNumber = `QA-IDEMPOTENCY-${Date.now()}`;

    // issue_certificate() checks `auth.uid() = p_user_id OR caller is admin` internally.
    // A service-role client's JWT has no `sub` claim, so auth.uid() resolves to NULL for
    // it — meaning a bare service-role RPC call can never satisfy that check. To exercise
    // a real second "issue" attempt the same way the app does (through an authenticated
    // user session), sign in as the student with a plain supabase-js client and call the
    // RPC as them. See the written report for why the literal "service-role client"
    // instruction can't reach the ON CONFLICT path at all.
    const asStudent = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { error: signInError } = await asStudent.auth.signInWithPassword({
      email: STUDENT.email,
      password: STUDENT.password,
    });
    expect(signInError).toBeNull();

    const { data: rpcResult, error: rpcError } = await asStudent.rpc('issue_certificate', {
      p_user_id: studentId,
      p_course_id: fixture.courseId,
      p_module_id: null,
      p_certificate_type: 'course',
      p_certificate_number: secondAttemptNumber,
    });
    expect(rpcError).toBeNull();
    // ON CONFLICT DO NOTHING should mean the RPC re-selected the pre-existing row rather
    // than inserting a new one with our fresh certificate_number.
    expect(rpcResult.certificate_number).toBe(before[0].certificate_number);
    expect(rpcResult.certificate_number).not.toBe(secondAttemptNumber);

    const { data: after, error: afterError } = await admin
      .from('certificates')
      .select('id, certificate_number')
      .eq('user_id', studentId)
      .eq('course_id', fixture.courseId);
    expect(afterError).toBeNull();
    expect(after).toHaveLength(1);
    expect(after[0].certificate_number).toBe(before[0].certificate_number);
  });

  test('5. a second user completing a lesson does not affect the first user\'s progress', async ({ browser }) => {
    const leaderContext = await browser.newContext();
    const leaderPage = await leaderContext.newPage();

    try {
      await login(leaderPage, LEADER);

      await leaderPage.goto(`/courses/${fixture.courseId}`);
      await leaderPage.getByRole('button', { name: 'Enroll Now — Free' }).click();
      await leaderPage.waitForLoadState('networkidle');

      // Complete only ONE of the two lessons so leader ends at 50%, not 100% — this
      // scenario is about isolation, not re-triggering leader's own completion.
      await leaderPage.goto(`/lessons/${fixture.lessonIds[0]}`);
      await expect(leaderPage.getByRole('button', { name: 'Mark as Complete' })).toBeVisible();
      await leaderPage.getByRole('button', { name: 'Mark as Complete' }).click();
      await expect(leaderPage.getByText('Lesson Completed!')).toBeVisible();
    } finally {
      await leaderContext.close();
    }

    const { data: studentEnrollment, error: studentError } = await admin
      .from('enrollments')
      .select('status, progress_percentage')
      .eq('user_id', studentId)
      .eq('course_id', fixture.courseId)
      .single();
    expect(studentError).toBeNull();
    expect(studentEnrollment.status).toBe('completed');
    expect(Number(studentEnrollment.progress_percentage)).toBe(100);

    const { data: leaderEnrollment, error: leaderError } = await admin
      .from('enrollments')
      .select('status, progress_percentage')
      .eq('user_id', leaderId)
      .eq('course_id', fixture.courseId)
      .single();
    expect(leaderError).toBeNull();
    expect(leaderEnrollment.status).toBe('active');
    expect(Number(leaderEnrollment.progress_percentage)).toBe(50);
  });
});
