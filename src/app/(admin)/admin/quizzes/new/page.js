import { getAllCourses, getAllLessons, getAllModules } from '@/actions/admin';
import NewQuizClient from './NewQuizClient';

export default async function NewQuizPage() {
  const [{ data: lessons }, { data: modules }, { data: courses }] = await Promise.all([
    getAllLessons(),
    getAllModules(),
    getAllCourses(),
  ]);

  return <NewQuizClient lessons={lessons || []} modules={modules || []} courses={courses || []} />;
}
