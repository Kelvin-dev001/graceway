export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import LeaderStats from '@/features/leader/LeaderStats';
import GenerationStats from '@/features/leader/GenerationStats';

export const metadata = { title: 'Leader Dashboard — Graceway' };

export default async function LeaderPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: tree } = await supabase.rpc('get_discipleship_tree', { leader_uuid: user.id });
  const { data: genStats } = await supabase.rpc('get_generation_stats', { leader_uuid: user.id });

  const totalStudents = tree?.length || 0;
  const thisMonth = new Date();
  thisMonth.setDate(1);
  const newThisMonth = tree?.filter(s => new Date(s.created_at) >= thisMonth).length || 0;

  const stats = { totalStudents, newThisMonth, generationStats: genStats || [] };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-extrabold text-navy-500 mb-1">Leader Dashboard</h1>
        <p className="text-gray-500">Monitor your discipleship network</p>
      </div>

      <LeaderStats stats={stats} />

      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-xl font-bold text-navy-500 mb-4">Generation Breakdown</h2>
        <GenerationStats generationStats={genStats || []} />
      </div>
    </div>
  );
}
