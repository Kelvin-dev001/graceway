export const dynamic = 'force-dynamic';

import { getAllModules, getAllSections } from '@/actions/admin';
import SectionForm from '@/features/admin/SectionForm';

export const metadata = { title: 'Manage Sections — Graceway' };

export default async function AdminSectionsPage() {
  const [{ data: modules }, { data: sections }] = await Promise.all([
    getAllModules(),
    getAllSections(),
  ]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-navy-500 mb-1">Sections</h1>
        <p className="text-gray-500">Manage module sections</p>
      </div>

      <SectionForm modules={modules || []} initialSections={sections || []} />
    </div>
  );
}
