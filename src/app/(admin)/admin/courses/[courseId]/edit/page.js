import { notFound } from 'next/navigation';
import { getCourse } from '@/actions/courses';
import EditCourseClient from './EditCourseClient';

export default async function EditCoursePage({ params }) {
  const { courseId } = await params;
  const { data: course } = await getCourse(courseId);

  if (!course) notFound();

  return <EditCourseClient course={course} />;
}
