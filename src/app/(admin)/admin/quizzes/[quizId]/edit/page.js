'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import QuizForm from '@/features/admin/QuizForm';

export default function EditQuizPage({ params }) {
  const router = useRouter();
  const [quiz, setQuiz] = useState(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.from('quizzes').select('*, questions(*, answers(*))').eq('id', params.quizId).single().then(({ data }) => setQuiz(data));
  }, [params.quizId]);

  if (!quiz) return <div className="text-center py-12 text-gray-400">Loading...</div>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-extrabold text-navy-500 mb-8">Edit Quiz</h1>
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <QuizForm onSuccess={() => router.push('/admin/quizzes')} />
      </div>
    </div>
  );
}
