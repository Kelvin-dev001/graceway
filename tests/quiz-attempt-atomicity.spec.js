const { test, expect } = require('@playwright/test');
const { loadEnvLocal } = require('./helpers/env');

// This is a Node test process, not `next dev`, so .env.local is not auto-loaded.
loadEnvLocal();

const { createClient } = require('@supabase/supabase-js');

// Covers CLAUDE.md bug #8 / Sprint 2 Task 3: submitQuizAttempt / submit_quiz_attempt()
// must (a) reject a not-enrolled user, (b) reject an unpublished quiz, and (c) enforce
// max_attempts atomically even under a genuine concurrent double-submit.
//
// NOTE: requires migration 005_quiz_attempt_atomic_submit.sql to already be applied to
// the target Supabase project -- until a human applies it, the `submit_quiz_attempt`
// RPC does not exist and the race test below will fail with a "function not found"
// error. That is expected/informative, not a false pass.

const STUDENT = { email: 'student@test.graceway.com', password: 'TestPass123!' };

const FIXTURE_SLUG = 'qa-quiz-atomicity-course';
const FIXTURE_COURSE_TITLE = 'QA Quiz Atomicity Course';

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
  await page.waitForLoadState('networkidle');
}

async function answerAndSubmit(page, { correctAnswerText }) {
  await page.getByRole('button', { name: correctAnswerText }).click();
  await page.getByRole('button', { name: 'Submit Quiz' }).click();
}

let admin;
let studentId;
let fixture = {};

test.describe.serial('Quiz attempt atomicity: enrollment gate, publish gate, max_attempts race', () => {
  test.beforeAll(async () => {
    admin = createAdminClient();

    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id, email')
      .eq('email', STUDENT.email)
      .maybeSingle();
    if (profileError) throw profileError;
    if (!profile) {
      throw new Error('Seeded student@test account not found. Run scripts/seed-test-users.js first.');
    }
    studentId = profile.id;

    // --- Reset: remove any prior fixture course + dependents so the suite reruns clean.
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
      await admin.from('quizzes').delete().eq('course_id', existingCourseId);
      // Cascades modules -> nothing else relevant for this fixture (no lessons needed).
      await admin.from('modules').delete().eq('course_id', existingCourseId);
      const { error: courseDeleteError } = await admin.from('courses').delete().eq('id', existingCourseId);
      if (courseDeleteError) throw courseDeleteError;
    }

    const { data: course, error: courseError } = await admin
      .from('courses')
      .insert({
        title: FIXTURE_COURSE_TITLE,
        slug: FIXTURE_SLUG,
        description: 'Playwright fixture course for the quiz-atomicity suite. Safe to reset/delete.',
        is_published: true,
        order_index: 9001,
      })
      .select()
      .single();
    if (courseError) throw courseError;

    // Published course_exam with max_attempts = 1, so the race test only has to prove
    // "exactly one of two simultaneous submits wins" rather than needing N tries.
    const { data: quiz, error: quizError } = await admin
      .from('quizzes')
      .insert({
        title: 'QA Atomicity Course Exam',
        quiz_type: 'course_exam',
        course_id: course.id,
        passing_score: 60,
        max_attempts: 1,
        is_published: true,
      })
      .select()
      .single();
    if (quizError) throw quizError;

    const { data: question, error: questionError } = await admin
      .from('questions')
      .insert({ quiz_id: quiz.id, question_text: '2 + 2?', question_type: 'multiple_choice', points: 1, order_index: 0 })
      .select()
      .single();
    if (questionError) throw questionError;

    const { error: answersError } = await admin
      .from('answers')
      .insert([
        { question_id: question.id, answer_text: 'Four', is_correct: true, order_index: 0 },
        { question_id: question.id, answer_text: 'Five', is_correct: false, order_index: 1 },
      ]);
    if (answersError) throw answersError;

    // Unpublished quiz on the same course, to test the publish gate.
    const { data: unpublishedQuiz, error: unpublishedQuizError } = await admin
      .from('quizzes')
      .insert({
        title: 'QA Atomicity Unpublished Quiz',
        quiz_type: 'course_exam',
        course_id: course.id,
        passing_score: 60,
        max_attempts: 3,
        is_published: false,
      })
      .select()
      .single();
    if (unpublishedQuizError) throw unpublishedQuizError;

    const { data: unpublishedQuestion, error: unpublishedQuestionError } = await admin
      .from('questions')
      .insert({ quiz_id: unpublishedQuiz.id, question_text: '1 + 1?', question_type: 'multiple_choice', points: 1, order_index: 0 })
      .select()
      .single();
    if (unpublishedQuestionError) throw unpublishedQuestionError;

    const { error: unpublishedAnswersError } = await admin
      .from('answers')
      .insert([
        { question_id: unpublishedQuestion.id, answer_text: 'Two', is_correct: true, order_index: 0 },
        { question_id: unpublishedQuestion.id, answer_text: 'Three', is_correct: false, order_index: 1 },
      ]);
    if (unpublishedAnswersError) throw unpublishedAnswersError;

    fixture = { courseId: course.id, quizId: quiz.id, unpublishedQuizId: unpublishedQuiz.id };
  });

  test.afterAll(async () => {
    await admin.from('quiz_attempts').delete().eq('quiz_id', fixture.quizId);
    await admin.from('enrollments').delete().eq('course_id', fixture.courseId).eq('user_id', studentId);
  });

  test('1. submitting without an active enrollment is rejected with an on-screen error', async ({ page }) => {
    await login(page, STUDENT);
    await page.goto(`/quizzes/${fixture.quizId}`);
    await answerAndSubmit(page, { correctAnswerText: 'Four' });

    await expect(page.getByText('You must be enrolled in this course to take this quiz.')).toBeVisible();

    const { data: attempts, error } = await admin
      .from('quiz_attempts')
      .select('id')
      .eq('quiz_id', fixture.quizId)
      .eq('user_id', studentId);
    expect(error).toBeNull();
    expect(attempts).toHaveLength(0);
  });

  test('2. an unpublished quiz is unreachable by a non-admin (RLS blocks it before submit is possible)', async ({ page }) => {
    // Enroll first so this test isolates the publish gate, not the enrollment gate.
    const { error: enrollError } = await admin
      .from('enrollments')
      .upsert({ user_id: studentId, course_id: fixture.courseId, status: 'active' }, { onConflict: 'user_id,course_id' });
    if (enrollError) throw enrollError;

    await login(page, STUDENT);
    await page.goto(`/quizzes/${fixture.unpublishedQuizId}`);

    // The quizzes SELECT RLS policy ("Published quizzes visible") already hides an
    // unpublished quiz row from a non-admin, so the page (a student-RLS-bound query)
    // redirects to /dashboard before any quiz UI -- and therefore submitQuizAttempt's
    // own is_published check -- is ever reachable. This is stronger protection than
    // "load the quiz and reject the submit", not a gap: confirmed directly that a
    // student-scoped SELECT of this quiz row returns zero rows.
    await expect(page).toHaveURL(/\/dashboard/);

    const { data: attempts, error } = await admin
      .from('quiz_attempts')
      .select('id')
      .eq('quiz_id', fixture.unpublishedQuizId)
      .eq('user_id', studentId);
    expect(error).toBeNull();
    expect(attempts).toHaveLength(0);
  });

  test('3. two near-simultaneous submits against max_attempts = 1 result in exactly one success', async ({ browser }) => {
    // Enrollment from test 2 persists (student is enrolled in fixture.courseId).
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    try {
      await login(pageA, STUDENT);
      await login(pageB, STUDENT);
      await pageA.goto(`/quizzes/${fixture.quizId}`);
      await pageB.goto(`/quizzes/${fixture.quizId}`);

      await pageA.getByRole('button', { name: 'Four' }).click();
      await pageB.getByRole('button', { name: 'Four' }).click();

      // Answer selection updates React state asynchronously (setAnswers); wait for the
      // "1/1 answered" counter to reflect it on both pages before firing the parallel
      // submits, otherwise handleSubmit's answers.length guard can read stale state and
      // fall into the native `alert('Please answer all questions...')` path on one side,
      // which blocks that page and makes this test flaky for a reason unrelated to the
      // thing actually under test (the DB-level attempt race).
      await pageA.getByText('1/1 answered').waitFor();
      await pageB.getByText('1/1 answered').waitFor();

      // Fire both submits as close together as possible to exercise the DB-level race,
      // not just app-level sequencing.
      await Promise.all([
        pageA.getByRole('button', { name: 'Submit Quiz' }).click(),
        pageB.getByRole('button', { name: 'Submit Quiz' }).click(),
      ]);

      const errorLocatorA = pageA.getByText('Maximum attempts reached');
      const errorLocatorB = pageB.getByText('Maximum attempts reached');
      // QuizResults.jsx renders BOTH "You passed the quiz!" (or "Keep Trying!") and a
      // separate "✓ PASSED"/"✗ FAILED" badge -- a loose /Passed|Failed/i regex matches
      // both text nodes on a passed result, so getByText() would resolve to 2 elements.
      // Target the badge text only, which is unambiguous.
      const resultLocatorA = pageA.getByText(/✓ PASSED|✗ FAILED/);
      const resultLocatorB = pageB.getByText(/✓ PASSED|✗ FAILED/);

      // The submit click only fires the request; the error/result render after a
      // network round-trip through the server action + RPC. isVisible() alone is an
      // immediate, non-retrying check, so calling it right after click() races the
      // render and reads both as "not visible" almost every time. Wait for whichever
      // outcome lands on each page first (one becomes visible, the other times out and
      // is caught as false), with a generous timeout for next-dev's slower responses.
      async function waitVisible(locator) {
        try {
          await locator.first().waitFor({ state: 'visible', timeout: 20000 });
          return true;
        } catch {
          return false;
        }
      }

      const [aHasError, bHasError] = await Promise.all([
        waitVisible(errorLocatorA),
        waitVisible(errorLocatorB),
      ]);
      const [aHasResult, bHasResult] = await Promise.all([
        waitVisible(resultLocatorA),
        waitVisible(resultLocatorB),
      ]);

      expect([aHasError, bHasError].filter(Boolean)).toHaveLength(1);
      expect([aHasResult, bHasResult].filter(Boolean)).toHaveLength(1);

      const { data: attempts, error } = await admin
        .from('quiz_attempts')
        .select('id')
        .eq('quiz_id', fixture.quizId)
        .eq('user_id', studentId);
      expect(error).toBeNull();
      expect(attempts).toHaveLength(1);
    } finally {
      await contextA.close();
      await contextB.close();
    }
  });
});
