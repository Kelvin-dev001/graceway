export const dynamic = 'force-dynamic';

import { getAllModules } from '@/actions/admin';
import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import DeleteModuleButton from '@/components/admin/DeleteModuleButton';

export const metadata = { title: 'Manage Modules — Graceway' };

export default async function AdminModulesPage() {
  const { data: modules } = await getAllModules();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-navy-500 mb-1">Modules</h1>
          <p className="text-gray-500">Manage course modules</p>
        </div>
        <Link href="/admin/modules/new" className="bg-orange-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-orange-600 transition-colors">
          + New Module
        </Link>
      </div>

      {!modules?.length ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-500">
          No modules yet. Create your first module.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Title</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Course</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {modules.map((module) => (
                <tr key={module.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{module.title}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{module.courses?.title}</td>
                  <td className="px-4 py-3">
                    <Badge variant={module.is_published ? 'success' : 'default'}>
                      {module.is_published ? 'Published' : 'Draft'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/modules/${module.id}/edit`} className="text-navy-500 text-sm font-medium hover:underline mr-3">Edit</Link>
                    <DeleteModuleButton moduleId={module.id} />
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
