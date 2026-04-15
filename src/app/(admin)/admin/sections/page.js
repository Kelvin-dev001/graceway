export const dynamic = 'force-dynamic';

import { getAllSections } from '@/actions/admin';
import Link from 'next/link';
import DeleteSectionButton from '@/components/admin/DeleteSectionButton';

export const metadata = { title: 'Manage Sections — Graceway' };

export default async function AdminSectionsPage() {
  const { data: sections } = await getAllSections();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-navy-500 mb-1">Sections</h1>
          <p className="text-gray-500">Manage module sections</p>
        </div>
        <Link href="/admin/sections/new" className="bg-orange-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-orange-600 transition-colors">
          + New Section
        </Link>
      </div>

      {!sections?.length ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-500">
          No sections yet. Create your first section.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Title</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Module</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Course</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sections.map((section) => (
                <tr key={section.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{section.title}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{section.modules?.title}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{section.modules?.courses?.title}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/sections/${section.id}/edit`} className="text-navy-500 text-sm font-medium hover:underline mr-3">Edit</Link>
                    <DeleteSectionButton sectionId={section.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
