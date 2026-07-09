const { test, expect } = require('@playwright/test');
const { loadEnvLocal } = require('./helpers/env');

// This is a Node test process, not `next dev`, so .env.local is not auto-loaded.
loadEnvLocal();

const { createClient } = require('@supabase/supabase-js');

const ADMIN = { email: 'admin@test.graceway.com', password: 'TestPass123!' };
const STUDENT_EMAIL = 'student@test.graceway.com';

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
}

// All five Delete*Button components use a bare native confirm() (and DeleteCourseButton /
// DeleteLessonButton additionally alert() on error). Playwright auto-dismisses unhandled
// dialogs, which makes confirm() return false and silently no-ops the delete — producing a
// false "row still exists" result indistinguishable from a real FK block. Register this
// BEFORE every delete click.
function acceptAllDialogs(page, { expectMessageContains } = {}) {
  page.on('dialog', async (dialog) => {
    if (expectMessageContains) expect(dialog.message()).toContain(expectMessageContains);
    await dialog.accept();
  });
}

// Delete*Button confirms via a blocking dialog, then awaits the server action, then calls
// router.refresh() — click() itself resolves as soon as the dialog is handled, well before
// the delete's own network round trip completes. A single waitForLoadState('networkidle')
// immediately followed by one page.goto() can race ahead of the DB write landing (confirmed
// directly: the row was already gone from the DB when checked moments after a "still
// visible" test failure). Retry the whole navigate+check cycle instead of trusting one shot.
async function expectGoneEventually(page, url, locator) {
  await expect(async () => {
    await page.goto(url);
    await expect(locator).toHaveCount(0);
  }).toPass({ timeout: 30000 });
}

// Deletes certificates referencing the course (or any of its modules) first, then modules
// (cascades sections/lessons/quizzes), then the course itself — certificates.course_id /
// .module_id are NO ACTION (migration 003), so certs must go first or the cleanup itself
// gets blocked by the very constraint this suite exists to prove.
async function resetCourseFixtureBySlug(admin, slug) {
  const { data: course, error: courseError } = await admin.from('courses').select('id').eq('slug', slug).maybeSingle();
  if (courseError) throw courseError;
  if (!course) return;

  const { data: modules, error: modulesError } = await admin.from('modules').select('id').eq('course_id', course.id);
  if (modulesError) throw modulesError;
  const moduleIds = (modules || []).map((m) => m.id);

  const { error: certByCourseError } = await admin.from('certificates').delete().eq('course_id', course.id);
  if (certByCourseError) throw certByCourseError;

  if (moduleIds.length > 0) {
    const { error: certByModuleError } = await admin.from('certificates').delete().in('module_id', moduleIds);
    if (certByModuleError) throw certByModuleError;
  }

  const { error: moduleDeleteError } = await admin.from('modules').delete().eq('course_id', course.id);
  if (moduleDeleteError) throw moduleDeleteError;

  const { error: courseDeleteError } = await admin.from('courses').delete().eq('id', course.id);
  if (courseDeleteError) throw courseDeleteError;
}

let admin;

test.describe.serial('Admin CRUD: happy path create -> edit -> delete (course -> module -> section -> lesson -> quiz)', () => {
  const FIXTURE_SLUG = 'qa-admin-crud-course';
  const COURSE_TITLE = 'QA Admin CRUD Course';
  const COURSE_TITLE_EDITED = 'QA Admin CRUD Course (edited)';
  const MODULE_TITLE = 'QA Admin CRUD Module';
  const MODULE_TITLE_EDITED = 'QA Admin CRUD Module (edited)';
  const SECTION_TITLE = 'QA Admin CRUD Section';
  const SECTION_TITLE_EDITED = 'QA Admin CRUD Section (edited)';
  const LESSON_TITLE = 'QA Admin CRUD Lesson';
  const LESSON_TITLE_EDITED = 'QA Admin CRUD Lesson (edited)';
  const LESSON_SLUG = 'qa-admin-crud-lesson';
  const QUIZ_TITLE = 'QA Admin CRUD Quiz';
  const QUIZ_TITLE_EDITED = 'QA Admin CRUD Quiz (edited)';

  let courseId;
  let moduleId;
  let sectionId;
  let lessonId;
  let quizId;

  test.beforeAll(async () => {
    admin = createAdminClient();
    await resetCourseFixtureBySlug(admin, FIXTURE_SLUG);
  });

  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN);
    await expect(page).toHaveURL(/\/admin/);
    await page.waitForLoadState('networkidle');
  });

  test('1. create course', async ({ page }) => {
    await page.goto('/admin/courses/new');
    await page.locator('input[name="title"]').fill(COURSE_TITLE);
    await page.locator('input[name="slug"]').fill(FIXTURE_SLUG);
    await page.locator('input[name="order_index"]').fill('42');
    await page.getByRole('button', { name: 'Create Course' }).click();

    await expect(page).toHaveURL(/\/admin\/courses$/);
    await page.goto('/admin/courses');
    await expect(page.getByText(COURSE_TITLE, { exact: true })).toBeVisible();
    await expect(page.getByText(FIXTURE_SLUG, { exact: true })).toBeVisible();

    const { data: course, error } = await admin.from('courses').select('*').eq('slug', FIXTURE_SLUG).single();
    expect(error).toBeNull();
    expect(course.order_index).toBe(42);
    courseId = course.id;
  });

  test('2. edit course', async ({ page }) => {
    await page.goto(`/admin/courses/${courseId}/edit`);
    await page.locator('input[name="title"]').fill(COURSE_TITLE_EDITED);
    await page.locator('input[name="order_index"]').fill('7');
    await page.getByRole('button', { name: 'Update Course' }).click();

    await expect(page).toHaveURL(/\/admin\/courses$/);
    await page.goto('/admin/courses');
    await expect(page.getByText(COURSE_TITLE_EDITED, { exact: true })).toBeVisible();
    await expect(page.getByText(COURSE_TITLE, { exact: true })).toHaveCount(0);

    const { data: course, error } = await admin.from('courses').select('order_index, title').eq('id', courseId).single();
    expect(error).toBeNull();
    expect(course.order_index).toBe(7);
    expect(course.title).toBe(COURSE_TITLE_EDITED);
  });

  test('3. create module', async ({ page }) => {
    await page.goto('/admin/modules/new');
    await page.locator('select[name="course_id"]').selectOption(courseId);
    await page.locator('input[name="title"]').fill(MODULE_TITLE);
    await page.getByRole('button', { name: 'Create Module' }).click();

    await expect(page).toHaveURL(/\/admin\/modules$/);
    await page.goto('/admin/modules');
    await expect(page.getByText(MODULE_TITLE, { exact: true })).toBeVisible();

    const { data: module, error } = await admin.from('modules').select('*').eq('course_id', courseId).eq('title', MODULE_TITLE).single();
    expect(error).toBeNull();
    moduleId = module.id;
  });

  test('4. edit module', async ({ page }) => {
    await page.goto(`/admin/modules/${moduleId}/edit`);
    await page.locator('input[name="title"]').fill(MODULE_TITLE_EDITED);
    await page.getByRole('button', { name: 'Update Module' }).click();

    await expect(page).toHaveURL(/\/admin\/modules$/);
    await page.goto('/admin/modules');
    await expect(page.getByText(MODULE_TITLE_EDITED, { exact: true })).toBeVisible();
    await expect(page.getByText(MODULE_TITLE, { exact: true })).toHaveCount(0);

    const { data: module, error } = await admin.from('modules').select('title').eq('id', moduleId).single();
    expect(error).toBeNull();
    expect(module.title).toBe(MODULE_TITLE_EDITED);
  });

  test('5. create section', async ({ page }) => {
    await page.goto('/admin/sections/new');
    await page.locator('select[name="module_id"]').selectOption(moduleId);
    await page.locator('input[name="title"]').fill(SECTION_TITLE);
    await page.getByRole('button', { name: 'Create Section' }).click();

    await expect(page).toHaveURL(/\/admin\/sections$/);
    await page.goto('/admin/sections');
    await expect(page.getByText(SECTION_TITLE, { exact: true })).toBeVisible();

    const { data: section, error } = await admin.from('sections').select('*').eq('module_id', moduleId).eq('title', SECTION_TITLE).single();
    expect(error).toBeNull();
    sectionId = section.id;
  });

  test('6. edit section', async ({ page }) => {
    await page.goto(`/admin/sections/${sectionId}/edit`);
    await page.locator('input[name="title"]').fill(SECTION_TITLE_EDITED);
    await page.getByRole('button', { name: 'Update Section' }).click();

    await expect(page).toHaveURL(/\/admin\/sections$/);
    await page.goto('/admin/sections');
    await expect(page.getByText(SECTION_TITLE_EDITED, { exact: true })).toBeVisible();
    await expect(page.getByText(SECTION_TITLE, { exact: true })).toHaveCount(0);

    const { data: section, error } = await admin.from('sections').select('title').eq('id', sectionId).single();
    expect(error).toBeNull();
    expect(section.title).toBe(SECTION_TITLE_EDITED);
  });

  test('7. create lesson', async ({ page }) => {
    await page.goto('/admin/lessons/new');
    await page.locator('select[name="module_id"]').selectOption(moduleId);
    await page.locator('select[name="section_id"]').selectOption(sectionId);
    await page.locator('input[name="title"]').fill(LESSON_TITLE);
    await page.locator('input[name="slug"]').fill(LESSON_SLUG);
    await page.getByRole('button', { name: 'Create Lesson' }).click();

    await expect(page).toHaveURL(/\/admin\/lessons$/);
    await page.goto('/admin/lessons');
    await expect(page.getByText(LESSON_TITLE, { exact: true })).toBeVisible();

    const { data: lesson, error } = await admin.from('lessons').select('*').eq('section_id', sectionId).eq('slug', LESSON_SLUG).single();
    expect(error).toBeNull();
    lessonId = lesson.id;
  });

  test('8. edit lesson', async ({ page }) => {
    await page.goto(`/admin/lessons/${lessonId}/edit`);
    await page.locator('input[name="title"]').fill(LESSON_TITLE_EDITED);
    await page.getByRole('button', { name: 'Update Lesson' }).click();

    await expect(page).toHaveURL(/\/admin\/lessons$/);
    await page.goto('/admin/lessons');
    await expect(page.getByText(LESSON_TITLE_EDITED, { exact: true })).toBeVisible();
    await expect(page.getByText(LESSON_TITLE, { exact: true })).toHaveCount(0);

    const { data: lesson, error } = await admin.from('lessons').select('title').eq('id', lessonId).single();
    expect(error).toBeNull();
    expect(lesson.title).toBe(LESSON_TITLE_EDITED);
  });

  test('9. create quiz + question', async ({ page }) => {
    await page.goto('/admin/quizzes/new');
    await page.locator('input[name="title"]').fill(QUIZ_TITLE);
    await page.locator('select[name="quiz_type"]').selectOption('course_exam');
    await page.locator('select[name="course_id"]').selectOption(courseId);
    await page.getByRole('button', { name: 'Create Quiz' }).click();

    await expect(page.getByText('Quiz created! Now add questions below.')).toBeVisible();

    await page.getByRole('button', { name: '+ Add Question' }).click();

    const questionCard = page.locator('div.border.border-gray-200.rounded-2xl.p-4', { hasText: 'Question 1' });
    await expect(questionCard).toBeVisible();

    // Question Text has no name/htmlFor — it's the first non-radio input in the card.
    await questionCard.locator('input:not([type="radio"])').first().fill('What does grace mean?');

    // Answer 1 is already the default is_correct; click it explicitly per the plan.
    await questionCard.locator('input[type="radio"]').first().click();
    await questionCard.getByPlaceholder('Answer 1').fill('Unmerited favor');
    await questionCard.getByPlaceholder('Answer 2').fill('A type of food');

    await page.getByRole('button', { name: 'Save Questions' }).click();
    await expect(page).toHaveURL(/\/admin\/quizzes$/);

    const quizRow = page.locator('tr', { hasText: QUIZ_TITLE });
    await expect(quizRow).toBeVisible();
    await expect(quizRow).toContainText('course exam');

    const { data: quiz, error } = await admin.from('quizzes').select('*').eq('course_id', courseId).eq('title', QUIZ_TITLE).single();
    expect(error).toBeNull();
    quizId = quiz.id;

    const { data: questions, error: questionsError } = await admin.from('questions').select('id').eq('quiz_id', quizId);
    expect(questionsError).toBeNull();
    expect(questions).toHaveLength(1);

    const { data: answers, error: answersError } = await admin.from('answers').select('is_correct').eq('question_id', questions[0].id);
    expect(answersError).toBeNull();
    expect(answers).toHaveLength(2);
    expect(answers.filter((a) => a.is_correct)).toHaveLength(1);
  });

  test('10. edit quiz', async ({ page }) => {
    await page.goto(`/admin/quizzes/${quizId}/edit`);
    await page.locator('input[name="title"]').fill(QUIZ_TITLE_EDITED);
    await page.locator('input[name="passing_score"]').fill('75');
    // QuizForm's onSuccess is only wired to the "Save Questions" button — editing quiz
    // metadata alone does NOT navigate. Wait for the in-flight update to settle instead.
    await page.getByRole('button', { name: 'Update Quiz' }).click();
    await page.waitForLoadState('networkidle');

    await page.goto(`/admin/quizzes/${quizId}`);
    await expect(page.getByRole('heading', { name: QUIZ_TITLE_EDITED })).toBeVisible();
    await expect(page.getByText('Passing Score: 75%')).toBeVisible();

    const { data: quiz, error } = await admin.from('quizzes').select('title, passing_score').eq('id', quizId).single();
    expect(error).toBeNull();
    expect(quiz.title).toBe(QUIZ_TITLE_EDITED);
    expect(quiz.passing_score).toBe(75);
  });

  test('11. delete quiz', async ({ page }) => {
    acceptAllDialogs(page);
    await page.goto('/admin/quizzes');
    const row = page.locator('tr', { hasText: QUIZ_TITLE_EDITED });
    await row.getByRole('button', { name: 'Delete' }).click();
    await page.waitForLoadState('networkidle');

    await expectGoneEventually(page, '/admin/quizzes', page.getByText(QUIZ_TITLE_EDITED, { exact: true }));

    const { data: quizzes, error: quizError } = await admin.from('quizzes').select('id').eq('id', quizId);
    expect(quizError).toBeNull();
    expect(quizzes).toHaveLength(0);

    const { data: questions, error: questionsError } = await admin.from('questions').select('id').eq('quiz_id', quizId);
    expect(questionsError).toBeNull();
    expect(questions).toHaveLength(0);
  });

  test('12. delete lesson', async ({ page }) => {
    acceptAllDialogs(page);
    await page.goto('/admin/lessons');
    const row = page.locator('tr', { hasText: LESSON_TITLE_EDITED });
    await row.getByRole('button', { name: 'Delete' }).click();
    await page.waitForLoadState('networkidle');

    await expectGoneEventually(page, '/admin/lessons', page.getByText(LESSON_TITLE_EDITED, { exact: true }));

    const { data: lesson, error } = await admin.from('lessons').select('id').eq('id', lessonId).maybeSingle();
    expect(error).toBeNull();
    expect(lesson).toBeNull();
  });

  test('13. delete section', async ({ page }) => {
    acceptAllDialogs(page);
    await page.goto('/admin/sections');
    const row = page.locator('tr', { hasText: SECTION_TITLE_EDITED });
    await row.getByRole('button', { name: 'Delete' }).click();
    await page.waitForLoadState('networkidle');

    await expectGoneEventually(page, '/admin/sections', page.getByText(SECTION_TITLE_EDITED, { exact: true }));

    const { data: section, error } = await admin.from('sections').select('id').eq('id', sectionId).maybeSingle();
    expect(error).toBeNull();
    expect(section).toBeNull();
  });

  test('14. delete module', async ({ page }) => {
    acceptAllDialogs(page);
    await page.goto('/admin/modules');
    const row = page.locator('tr', { hasText: MODULE_TITLE_EDITED });
    await row.getByRole('button', { name: 'Delete' }).click();
    await page.waitForLoadState('networkidle');

    await expectGoneEventually(page, '/admin/modules', page.getByText(MODULE_TITLE_EDITED, { exact: true }));

    const { data: module, error } = await admin.from('modules').select('id').eq('id', moduleId).maybeSingle();
    expect(error).toBeNull();
    expect(module).toBeNull();
  });

  test('15. delete course', async ({ page }) => {
    acceptAllDialogs(page);
    await page.goto('/admin/courses');
    const row = page.locator('tr', { hasText: COURSE_TITLE_EDITED });
    await row.getByRole('button', { name: 'Delete' }).click();
    await page.waitForLoadState('networkidle');

    await expectGoneEventually(page, '/admin/courses', page.getByText(COURSE_TITLE_EDITED, { exact: true }));

    const { data: course, error } = await admin.from('courses').select('id').eq('id', courseId).maybeSingle();
    expect(error).toBeNull();
    expect(course).toBeNull();
  });
});

test.describe.serial('Admin CRUD: delete cascade vs block (migration 003)', () => {
  const CASCADE_SLUG = 'qa-admin-crud-cascade-course';
  const CASCADE_COURSE_TITLE = 'QA Admin CRUD Cascade Course';
  const BLOCKED_COURSE_SLUG = 'qa-admin-crud-blocked-course';
  const BLOCKED_COURSE_TITLE = 'QA Admin CRUD Blocked Course';
  const BLOCKED_COURSE_CERT_NUMBER = 'QA-ADMIN-CRUD-BLOCK-COURSE';
  const BLOCKED_MODULE_COURSE_SLUG = 'qa-admin-crud-blocked-module-course';
  const BLOCKED_MODULE_COURSE_TITLE = 'QA Admin CRUD Blocked Module Course';
  const BLOCKED_MODULE_TITLE = 'QA Admin CRUD Blocked Module';
  const BLOCKED_MODULE_CERT_NUMBER = 'QA-ADMIN-CRUD-BLOCK-MODULE';

  let studentId;

  test.beforeAll(async () => {
    admin = createAdminClient();

    const { data: studentProfile, error: studentError } = await admin
      .from('profiles')
      .select('id')
      .eq('email', STUDENT_EMAIL)
      .maybeSingle();
    if (studentError) throw studentError;
    if (!studentProfile) {
      throw new Error('Seeded student@test.graceway.com not found in profiles. Run scripts/seed-test-users.js first.');
    }
    studentId = studentProfile.id;

    // Certs first (unique certificate_number would otherwise block a rerun), then
    // modules/courses, matching the FK-safe order this suite exists to demonstrate.
    const { error: certCleanupError } = await admin
      .from('certificates')
      .delete()
      .in('certificate_number', [BLOCKED_COURSE_CERT_NUMBER, BLOCKED_MODULE_CERT_NUMBER]);
    if (certCleanupError) throw certCleanupError;

    await resetCourseFixtureBySlug(admin, CASCADE_SLUG);
    await resetCourseFixtureBySlug(admin, BLOCKED_COURSE_SLUG);
    await resetCourseFixtureBySlug(admin, BLOCKED_MODULE_COURSE_SLUG);
  });

  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN);
    await expect(page).toHaveURL(/\/admin/);
    await page.waitForLoadState('networkidle');
  });

  test('B1. course with no certificate deletes and cascades to module/section/lesson', async ({ page }) => {
    const { data: course, error: courseError } = await admin
      .from('courses')
      .insert({ title: CASCADE_COURSE_TITLE, slug: CASCADE_SLUG, is_published: true, order_index: 9001 })
      .select()
      .single();
    expect(courseError).toBeNull();

    const { data: module, error: moduleError } = await admin
      .from('modules')
      .insert({ course_id: course.id, title: 'QA Admin CRUD Cascade Module', order_index: 0, is_published: true })
      .select()
      .single();
    expect(moduleError).toBeNull();

    const { data: section, error: sectionError } = await admin
      .from('sections')
      .insert({ module_id: module.id, title: 'QA Admin CRUD Cascade Section', order_index: 0 })
      .select()
      .single();
    expect(sectionError).toBeNull();

    const { data: lesson, error: lessonError } = await admin
      .from('lessons')
      .insert({
        section_id: section.id,
        module_id: module.id,
        title: 'QA Admin CRUD Cascade Lesson',
        slug: 'qa-admin-crud-cascade-lesson',
        content: 'Fixture lesson for the cascade-delete case.',
        order_index: 0,
        is_published: true,
      })
      .select()
      .single();
    expect(lessonError).toBeNull();

    acceptAllDialogs(page);
    await page.goto('/admin/courses');
    const row = page.locator('tr', { hasText: CASCADE_COURSE_TITLE });
    await row.getByRole('button', { name: 'Delete' }).click();
    await page.waitForLoadState('networkidle');

    await expectGoneEventually(page, '/admin/courses', page.getByText(CASCADE_COURSE_TITLE, { exact: true }));

    const { data: courseAfter } = await admin.from('courses').select('id').eq('id', course.id).maybeSingle();
    const { data: moduleAfter } = await admin.from('modules').select('id').eq('id', module.id).maybeSingle();
    const { data: sectionAfter } = await admin.from('sections').select('id').eq('id', section.id).maybeSingle();
    const { data: lessonAfter } = await admin.from('lessons').select('id').eq('id', lesson.id).maybeSingle();
    expect(courseAfter).toBeNull();
    expect(moduleAfter).toBeNull();
    expect(sectionAfter).toBeNull();
    expect(lessonAfter).toBeNull();
  });

  test('B2. course with an existing certificate is blocked from deletion (course-level)', async ({ page }) => {
    const { data: course, error: courseError } = await admin
      .from('courses')
      .insert({ title: BLOCKED_COURSE_TITLE, slug: BLOCKED_COURSE_SLUG, is_published: true, order_index: 9002 })
      .select()
      .single();
    expect(courseError).toBeNull();

    const { data: cert, error: certError } = await admin
      .from('certificates')
      .insert({
        user_id: studentId,
        course_id: course.id,
        module_id: null,
        certificate_type: 'course',
        certificate_number: BLOCKED_COURSE_CERT_NUMBER,
      })
      .select()
      .single();
    expect(certError).toBeNull();

    // Two dialogs fire here: DeleteCourseButton's confirm(), then (once the FK violation
    // comes back as an action error) its error-path alert(). Accept both, and assert the
    // alert's message on the way through.
    const dialogMessages = [];
    page.on('dialog', async (dialog) => {
      dialogMessages.push(dialog.message());
      await dialog.accept();
    });

    await page.goto('/admin/courses');
    const row = page.locator('tr', { hasText: BLOCKED_COURSE_TITLE });
    await row.getByRole('button', { name: 'Delete' }).click();
    await page.waitForLoadState('networkidle');
    await expect.poll(() => dialogMessages.length).toBeGreaterThanOrEqual(2);
    expect(dialogMessages[1]).toContain('Failed to delete course');

    await expect(page.getByText(BLOCKED_COURSE_TITLE, { exact: true })).toBeVisible();

    const { data: courseAfter } = await admin.from('courses').select('id').eq('id', course.id).maybeSingle();
    const { data: certAfter } = await admin.from('certificates').select('id').eq('id', cert.id).maybeSingle();
    expect(courseAfter).not.toBeNull();
    expect(certAfter).not.toBeNull();
  });

  test('B3. module with an existing certificate is blocked from deletion (module-level)', async ({ page }) => {
    const { data: course, error: courseError } = await admin
      .from('courses')
      .insert({ title: BLOCKED_MODULE_COURSE_TITLE, slug: BLOCKED_MODULE_COURSE_SLUG, is_published: true, order_index: 9003 })
      .select()
      .single();
    expect(courseError).toBeNull();

    const { data: module, error: moduleError } = await admin
      .from('modules')
      .insert({ course_id: course.id, title: BLOCKED_MODULE_TITLE, order_index: 0, is_published: true })
      .select()
      .single();
    expect(moduleError).toBeNull();

    const { data: cert, error: certError } = await admin
      .from('certificates')
      .insert({
        user_id: studentId,
        course_id: null,
        module_id: module.id,
        certificate_type: 'module',
        certificate_number: BLOCKED_MODULE_CERT_NUMBER,
      })
      .select()
      .single();
    expect(certError).toBeNull();

    // DeleteModuleButton shows an inline "Delete failed." message on error, no alert() —
    // only the confirm() dialog needs handling here.
    acceptAllDialogs(page);
    await page.goto('/admin/modules');
    const row = page.locator('tr', { hasText: BLOCKED_MODULE_TITLE });
    await row.getByRole('button', { name: 'Delete' }).click();
    await page.waitForLoadState('networkidle');

    await expect(row.getByText('Delete failed.')).toBeVisible();

    const { data: moduleAfter } = await admin.from('modules').select('id').eq('id', module.id).maybeSingle();
    const { data: certAfter } = await admin.from('certificates').select('id').eq('id', cert.id).maybeSingle();
    expect(moduleAfter).not.toBeNull();
    expect(certAfter).not.toBeNull();
  });
});
