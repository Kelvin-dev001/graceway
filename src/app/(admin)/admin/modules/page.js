export const dynamic = 'force-dynamic';

import { getAllCourses, getAllModules } from '@/actions/admin';
import ModuleForm from '@/features/admin/ModuleForm';

export const metadata = { title: 'Manage Modules — Graceway' };

export default async function AdminModulesPage() {
  const [{ data: courses }, { data: modules }] = await Promise.all([
    getAllCourses(),
    getAllModules(),
  ]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-navy-500 mb-1">Modules</h1>
        <p className="text-gray-500">Manage course modules</p>
      </div>

      <ModuleForm courses={courses || []} initialModules={modules || []} />
    </div>
  );
}
