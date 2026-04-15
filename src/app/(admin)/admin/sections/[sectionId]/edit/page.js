import { notFound } from 'next/navigation';
import { getAllModules, getSection } from '@/actions/admin';
import EditSectionClient from './EditSectionClient';

export default async function EditSectionPage({ params }) {
  const { sectionId } = await params;
  const [{ data: section }, { data: modules }] = await Promise.all([
    getSection(sectionId),
    getAllModules(),
  ]);

  if (!section) notFound();

  return <EditSectionClient section={section} modules={modules || []} />;
}
