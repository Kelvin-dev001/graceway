'use server';

import { createClient } from '@/lib/supabase/server';

export async function getLeaderStats() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null };

  const { data: tree, error } = await supabase.rpc('get_discipleship_tree', { leader_uuid: user.id });
  if (error) return { error: error.message };

  const { data: genStats } = await supabase.rpc('get_generation_stats', { leader_uuid: user.id });

  const totalStudents = tree?.length || 0;
  const thisMonth = new Date();
  thisMonth.setDate(1);
  const newThisMonth = tree?.filter(s => new Date(s.created_at) >= thisMonth).length || 0;

  return {
    data: {
      totalStudents,
      newThisMonth,
      generationStats: genStats || [],
      students: tree || [],
    },
  };
}

export async function getLeaderStudents() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [] };

  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, role, created_at, generation_level, profile_photo')
    .eq('leader_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return { error: error.message };
  return { data };
}

export async function getDiscipleshipTree() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [] };

  const { data, error } = await supabase.rpc('get_discipleship_tree', { leader_uuid: user.id });
  if (error) return { error: error.message };
  return { data };
}
