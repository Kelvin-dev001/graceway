export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import CourseCard from '@/features/learning/CourseCard';

export const metadata = { title: 'Courses — Graceway' };

export default async function CoursesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: courses } = await supabase
    .from('courses')
    .select('*')
    .eq('is_published', true)
    .order('order_index');

  let enrollments = [];
  if (user) {
    const { data } = await supabase.from('enrollments').select('*').eq('user_id', user.id);
    enrollments = data || [];
  }

  const enrollmentMap = enrollments.reduce((acc, e) => {
    acc[e.course_id] = e;
    return acc;
  }, {});

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-navy-500 mb-2">Courses</h1>
        <p className="text-gray-500">Grow through structured discipleship training</p>
      </div>

      {!courses?.length ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">📚</div>
          <p>No courses available yet. Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              enrollment={enrollmentMap[course.id]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
