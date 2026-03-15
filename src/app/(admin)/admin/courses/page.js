export const dynamic = 'force-dynamic';

import { getAllCourses } from '@/actions/admin';
import Link from 'next/link';
import { deleteCourse } from '@/actions/courses';
import Badge from '@/components/ui/Badge';

export const metadata = { title: 'Manage Courses — Graceway' };

export default async function AdminCoursesPage() {
  const { data: courses } = await getAllCourses();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-navy-500 mb-1">Courses</h1>
          <p className="text-gray-500">Manage all courses</p>
        </div>
        <Link href="/admin/courses/new" className="bg-orange-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-orange-600 transition-colors">
          + New Course
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Title</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {courses?.map(course => (
              <tr key={course.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-800">{course.title}</div>
                  <div className="text-xs text-gray-400">{course.slug}</div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={course.is_published ? 'success' : 'default'}>
                    {course.is_published ? 'Published' : 'Draft'}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/courses/${course.id}/edit`} className="text-navy-500 text-sm font-medium hover:underline mr-3">Edit</Link>
                  <form action={deleteCourse.bind(null, course.id)} className="inline">
                    <button type="submit" className="text-red-500 text-sm font-medium hover:underline" onClick={(e) => { if (!confirm('Delete this course?')) e.preventDefault(); }}>
                      Delete
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
