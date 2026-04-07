export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import StudentList from '@/features/leader/StudentList';

export const metadata = { title: 'My Students — Graceway' };

export default async function LeaderStudentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: tree } = await supabase.rpc('get_discipleship_tree', { leader_uuid: user.id });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-navy-500 mb-2">My Students</h1>
        <p className="text-gray-500">All students in your discipleship network</p>
      </div>
      <StudentList students={tree || []} />
    </div>
  );
}
