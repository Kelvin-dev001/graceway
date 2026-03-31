export const dynamic = 'force-dynamic';

import { getAllLessons } from '@/actions/admin';
import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import DeleteLessonButton from '@/components/admin/DeleteLessonButton';

export const metadata = { title: 'Lessons — Graceway Admin' };

export default async function AdminLessonsPage() {
  const { data: lessons } = await getAllLessons();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-navy-500 mb-1">Lessons</h1>
          <p className="text-gray-500">Manage all lessons</p>
        </div>
        <Link href="/admin/lessons/new" className="bg-orange-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-orange-600 transition-colors">
          + New Lesson
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Lesson</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Module</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {lessons?.map(lesson => (
              <tr key={lesson.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-800">{lesson.title}</div>
                  {lesson.duration_minutes > 0 && <div className="text-xs text-gray-400">{lesson.duration_minutes}m</div>}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{lesson.modules?.title}</td>
                <td className="px-4 py-3">
                  <Badge variant={lesson.is_published ? 'success' : 'default'}>
                    {lesson.is_published ? 'Published' : 'Draft'}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <DeleteLessonButton lessonId={lesson.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
