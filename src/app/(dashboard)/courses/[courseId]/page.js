export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { enrollInCourse } from '@/actions/courses';
import ModuleList from '@/features/learning/ModuleList';
import ProgressBar from '@/components/ui/ProgressBar';

export default async function CourseDetailPage({ params }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: course } = await supabase
    .from('courses')
    .select('*, modules(*, sections(*, lessons(*)))')
    .eq('id', params.courseId)
    .single();

  if (!course) redirect('/courses');

  let enrollment = null;
  let completedLessons = [];

  if (user) {
    const { data: enroll } = await supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', user.id)
      .eq('course_id', params.courseId)
      .single();
    enrollment = enroll;

    const { data: progress } = await supabase
      .from('lesson_progress')
      .select('lesson_id')
      .eq('user_id', user.id)
      .eq('status', 'completed');
    completedLessons = (progress || []).map((p) => p.lesson_id);
  }

  const allLessons = course.modules?.flatMap(m => m.sections?.flatMap(s => s.lessons || []) || []) || [];
  const progressPercent = allLessons.length ? (completedLessons.length / allLessons.length) * 100 : 0;

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        {course.thumbnail && (
          <img src={course.thumbnail} alt={course.title} className="w-full h-48 object-cover rounded-2xl mb-6" />
        )}
        <h1 className="text-3xl font-extrabold text-navy-500 mb-2">{course.title}</h1>
        {course.description && <p className="text-gray-600 mb-4">{course.description}</p>}

        {enrollment ? (
          <ProgressBar value={progressPercent} max={100} label="Course Progress" />
        ) : (
          <form action={enrollInCourse.bind(null, params.courseId)}>
            <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-xl font-bold transition-colors">
              Enroll Now — Free
            </button>
          </form>
        )}
      </div>

      <div>
        <h2 className="text-xl font-bold text-navy-500 mb-4">Course Curriculum</h2>
        <ModuleList
          modules={course.modules || []}
          completedLessons={completedLessons}
        />
      </div>
    </div>
  );
}
