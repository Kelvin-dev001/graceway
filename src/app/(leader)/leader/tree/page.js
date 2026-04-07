export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DiscipleshipTree from '@/components/shared/DiscipleshipTree';

export const metadata = { title: 'Discipleship Tree — Graceway' };

export default async function LeaderTreePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: tree } = await supabase.rpc('get_discipleship_tree', { leader_uuid: user.id });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-navy-500 mb-2">Discipleship Tree</h1>
        <p className="text-gray-500">Visualize your entire spiritual family tree</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <DiscipleshipTree students={tree || []} />
      </div>
    </div>
  );
}
