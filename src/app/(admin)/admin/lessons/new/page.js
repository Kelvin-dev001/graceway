export const dynamic = 'force-dynamic';

import { getAllModules, getAllSections } from '@/actions/admin';
import NewLessonClient from './NewLessonClient';

export const metadata = { title: 'New Lesson — Graceway' };

export default async function NewLessonPage() {
  const [{ data: modules }, { data: sections }] = await Promise.all([
    getAllModules(),
    getAllSections(),
  ]);

  return (
    <NewLessonClient modules={modules || []} sections={sections || []} />
  );
}
