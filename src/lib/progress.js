/**
 * Calculate a bounded lesson progress percentage.
 * Returns 0 when totalCount is zero/invalid.
 */
export function calculateProgress(completedCount, totalCount) {
  if (!totalCount || totalCount <= 0) return 0;
  const percentage = (completedCount / totalCount) * 100;
  return Math.max(0, Math.min(100, Math.round(percentage)));
}

export function buildCourseProgressMap(modules = [], lessons = [], lessonProgress = []) {
  const moduleToCourse = modules.reduce((acc, module) => {
    acc[module.id] = module.course_id;
    return acc;
  }, {});

  const completedLessonIds = new Set(lessonProgress.map((item) => item.lesson_id));

  return lessons.reduce((acc, lesson) => {
    const courseId = moduleToCourse[lesson.module_id];
    if (!courseId) return acc;

    if (!acc[courseId]) {
      acc[courseId] = { totalLessons: 0, completedLessons: 0 };
    }

    acc[courseId].totalLessons += 1;
    if (completedLessonIds.has(lesson.id)) {
      acc[courseId].completedLessons += 1;
    }
    return acc;
  }, {});
}

export async function getCourseProgressMap({ supabase, userId, courseIds = [] }) {
  if (!supabase || !userId || !courseIds.length) return {};

  const { data: modules } = await supabase
    .from('modules')
    .select('id, course_id')
    .in('course_id', courseIds);

  if (!modules?.length) return {};

  const moduleIds = modules.map((module) => module.id);

  const [{ data: lessons }, { data: lessonProgress }] = await Promise.all([
    supabase.from('lessons').select('id, module_id').in('module_id', moduleIds),
    supabase
      .from('lesson_progress')
      .select('lesson_id')
      .eq('user_id', userId)
      .eq('status', 'completed'),
  ]);

  return buildCourseProgressMap(modules || [], lessons || [], lessonProgress || []);
}
