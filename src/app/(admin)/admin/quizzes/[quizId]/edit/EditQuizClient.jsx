'use client';

import { useRouter } from 'next/navigation';
import QuizForm from '@/features/admin/QuizForm';

export default function EditQuizClient({ quiz, lessons = [], modules = [] }) {
  const router = useRouter();

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-extrabold text-navy-500 mb-8">Edit Quiz</h1>
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <QuizForm quiz={quiz} lessons={lessons} modules={modules} onSuccess={() => router.push('/admin/quizzes')} />
      </div>
    </div>
  );
}
