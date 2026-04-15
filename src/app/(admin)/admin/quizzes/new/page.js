import { getAllLessons, getAllModules } from '@/actions/admin';
import NewQuizClient from './NewQuizClient';

export default async function NewQuizPage() {
  const [{ data: lessons }, { data: modules }] = await Promise.all([
    getAllLessons(),
    getAllModules(),
  ]);

  return <NewQuizClient lessons={lessons || []} modules={modules || []} />;
}
