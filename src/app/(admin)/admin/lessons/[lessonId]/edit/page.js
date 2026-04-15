import { notFound } from 'next/navigation';
import { getAllModules, getAllSections } from '@/actions/admin';
import { getLesson } from '@/actions/lessons';
import EditLessonClient from './EditLessonClient';

export default async function EditLessonPage({ params }) {
  const { lessonId } = await params;
  const [{ data: lesson }, { data: modules }, { data: sections }] = await Promise.all([
    getLesson(lessonId),
    getAllModules(),
    getAllSections(),
  ]);

  if (!lesson) notFound();

  return <EditLessonClient lesson={lesson} modules={modules || []} sections={sections || []} />;
}
