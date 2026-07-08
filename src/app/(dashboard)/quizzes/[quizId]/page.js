export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import QuizEngine from '@/features/quizzes/QuizEngine';

export default async function QuizPage({ params }) {
  const { quizId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: quiz } = await supabase
    .from('quizzes')
    .select('*, questions(*, answers(*))')
    .eq('id', quizId)
    .single();

  if (!quiz) redirect('/dashboard');

  const { data: attempts } = await supabase
    .from('quiz_attempts')
    .select('*')
    .eq('quiz_id', quizId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-3xl">
      <QuizEngine quiz={quiz} previousAttempts={attempts || []} />
    </div>
  );
}
