import { getAllModules } from '@/actions/admin';
import NewSectionClient from './NewSectionClient';

export default async function NewSectionPage() {
  const { data: modules } = await getAllModules();
  return <NewSectionClient modules={modules || []} />;
}
