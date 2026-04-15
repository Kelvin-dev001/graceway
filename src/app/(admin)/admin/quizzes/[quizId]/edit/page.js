import { notFound } from 'next/navigation';
import { getQuiz } from '@/actions/quizzes';
import { getAllCourses, getAllLessons, getAllModules } from '@/actions/admin';
import EditQuizClient from './EditQuizClient';

export default async function EditQuizPage({ params }) {
  const { quizId } = await params;
  const [{ data: quiz }, { data: lessons }, { data: modules }, { data: courses }] = await Promise.all([
    getQuiz(quizId),
    getAllLessons(),
    getAllModules(),
    getAllCourses(),
  ]);

  if (!quiz) notFound();

  return <EditQuizClient quiz={quiz} lessons={lessons || []} modules={modules || []} courses={courses || []} />;
}
