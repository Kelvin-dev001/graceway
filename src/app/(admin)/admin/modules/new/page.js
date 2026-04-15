import { getAllCourses } from '@/actions/admin';
import NewModuleClient from './NewModuleClient';

export default async function NewModulePage() {
  const { data: courses } = await getAllCourses();
  return <NewModuleClient courses={courses || []} />;
}
