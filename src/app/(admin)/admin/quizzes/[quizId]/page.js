export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getQuiz } from '@/actions/quizzes';

export default async function AdminQuizDetailPage({ params }) {
  const { quizId } = await params;
  const { data: quiz } = await getQuiz(quizId);

  if (!quiz) notFound();

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-navy-500 mb-1">{quiz.title}</h1>
          <p className="text-gray-500 text-sm">{quiz.description || 'No description provided.'}</p>
        </div>
        <Link href={`/admin/quizzes/${quiz.id}/edit`} className="bg-navy-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-navy-600">
          Edit Quiz
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
        <p className="text-sm text-gray-600 mb-2"><span className="font-medium">Type:</span> {quiz.quiz_type.replace('_', ' ')}</p>
        <p className="text-sm text-gray-600 mb-2"><span className="font-medium">Passing Score:</span> {quiz.passing_score}%</p>
        <p className="text-sm text-gray-600 mb-2"><span className="font-medium">Max Attempts:</span> {quiz.max_attempts}</p>
        <p className="text-sm text-gray-600 mb-2">
          <span className="font-medium">Associated With:</span> {quiz.courses?.title || quiz.modules?.title || quiz.lessons?.title || '—'}
        </p>
        <p className="text-sm text-gray-600"><span className="font-medium">Status:</span> {quiz.is_published ? 'Published' : 'Draft'}</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-navy-500">Questions</h2>
        {!quiz.questions?.length ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-sm text-gray-500">
            No questions yet.
          </div>
        ) : (
          quiz.questions.map((question, index) => (
            <div key={question.id} className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-800 mb-3">Q{index + 1}. {question.question_text}</h3>
              <ul className="space-y-2">
                {question.answers?.map((answer) => (
                  <li key={answer.id} className={`text-sm ${answer.is_correct ? 'text-green-700 font-medium' : 'text-gray-600'}`}>
                    {answer.is_correct ? '✓ ' : '• '}
                    {answer.answer_text}
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
