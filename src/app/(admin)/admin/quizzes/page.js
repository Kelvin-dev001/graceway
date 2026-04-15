export const dynamic = 'force-dynamic';

import { getAllQuizzes } from '@/actions/admin';
import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import DeleteQuizButton from '@/components/admin/DeleteQuizButton';

export const metadata = { title: 'Quizzes — Graceway Admin' };

export default async function AdminQuizzesPage() {
  const { data: quizzes } = await getAllQuizzes();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-navy-500 mb-1">Quizzes</h1>
          <p className="text-gray-500">Manage all quizzes and exams</p>
        </div>
        <Link href="/admin/quizzes/new" className="bg-orange-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-orange-600 transition-colors">
          + New Quiz
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Quiz</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Pass %</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {quizzes?.map(quiz => (
              <tr key={quiz.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{quiz.title}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{quiz.quiz_type.replace('_', ' ')}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{quiz.passing_score}%</td>
                <td className="px-4 py-3">
                  <Badge variant={quiz.is_published ? 'success' : 'default'}>
                    {quiz.is_published ? 'Live' : 'Draft'}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/quizzes/${quiz.id}/edit`} className="text-navy-500 text-sm font-medium hover:underline mr-3">Edit</Link>
                  <DeleteQuizButton quizId={quiz.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
