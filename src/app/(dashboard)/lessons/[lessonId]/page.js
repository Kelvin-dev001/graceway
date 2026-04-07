export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import LessonContent from '@/features/learning/LessonContent';
import ProgressTracker from '@/features/learning/ProgressTracker';

export default async function LessonPage({ params }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: lesson } = await supabase
    .from('lessons')
    .select('*, sections(*), modules(*, courses(*))')
    .eq('id', params.lessonId)
    .single();

  if (!lesson) redirect('/dashboard');

  const { data: progress } = await supabase
    .from('lesson_progress')
    .select('status')
    .eq('user_id', user.id)
    .eq('lesson_id', params.lessonId)
    .single();

  const isCompleted = progress?.status === 'completed';

  const { data: quizzes } = await supabase
    .from('quizzes')
    .select('id, title')
    .eq('lesson_id', params.lessonId)
    .eq('is_published', true);

  return (
    <div className="max-w-3xl">
      <div className="mb-4">
        <Link href={`/courses/${lesson.modules?.courses?.id}`} className="text-sm text-navy-500 hover:underline flex items-center gap-1">
          ← {lesson.modules?.courses?.title || 'Back to Course'}
        </Link>
      </div>

      <LessonContent lesson={lesson} />

      <div className="mt-8 pt-8 border-t border-gray-100 flex flex-col gap-4">
        <ProgressTracker lessonId={params.lessonId} isCompleted={isCompleted} />

        {quizzes && quizzes.length > 0 && (
          <div>
            <h3 className="font-bold text-navy-500 mb-3">Quiz for this Lesson</h3>
            {quizzes.map(q => (
              <Link key={q.id} href={`/quizzes/${q.id}`} className="block bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-orange-700 font-semibold hover:bg-orange-100 transition-colors">
                📝 {q.title}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
