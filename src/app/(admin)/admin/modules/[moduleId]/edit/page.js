import { notFound } from 'next/navigation';
import { getAllCourses, getModule } from '@/actions/admin';
import EditModuleClient from './EditModuleClient';

export default async function EditModulePage({ params }) {
  const { moduleId } = await params;
  const [{ data: module }, { data: courses }] = await Promise.all([
    getModule(moduleId),
    getAllCourses(),
  ]);

  if (!module) notFound();

  return <EditModuleClient module={module} courses={courses || []} />;
}
