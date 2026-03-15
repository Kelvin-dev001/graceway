'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function getAdminStats() {
  const supabase = createClient();

  const [
    { count: totalUsers },
    { count: totalCourses },
    { count: totalCertificates },
    { count: totalLeaders },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('courses').select('*', { count: 'exact', head: true }),
    supabase.from('certificates').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'leader'),
  ]);

  const thisMonth = new Date();
  thisMonth.setDate(1);
  const { count: newUsersThisMonth } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', thisMonth.toISOString());

  return {
    data: {
      totalUsers: totalUsers || 0,
      totalCourses: totalCourses || 0,
      totalCertificates: totalCertificates || 0,
      totalLeaders: totalLeaders || 0,
      newUsersThisMonth: newUsersThisMonth || 0,
    },
  };
}

export async function getAllUsers() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return { error: error.message };
  return { data };
}

export async function updateUserRole(userId, role) {
  const supabase = createClient();
  const { error } = await supabase
    .from('profiles')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) return { error: error.message };
  revalidatePath('/admin/users');
  return { success: true };
}

export async function getAllCertificates() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('certificates')
    .select('*, profiles(name, email), courses(title), modules(title)')
    .order('issued_at', { ascending: false });

  if (error) return { error: error.message };
  return { data };
}

export async function createModule(formData) {
  const supabase = createClient();
  const title = formData.get('title');
  const description = formData.get('description');
  const courseId = formData.get('course_id');
  const isPublished = formData.get('is_published') === 'true';

  const { data, error } = await supabase
    .from('modules')
    .insert({ title, description, course_id: courseId, is_published: isPublished })
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath('/admin/modules');
  return { data };
}

export async function getAllModules() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('modules')
    .select('*, courses(title)')
    .order('order_index');

  if (error) return { error: error.message };
  return { data };
}

export async function getAllLessons() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('lessons')
    .select('*, modules(title, courses(title))')
    .order('order_index');

  if (error) return { error: error.message };
  return { data };
}

export async function getAllQuizzes() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('quizzes')
    .select('*, lessons(title), modules(title)')
    .order('created_at', { ascending: false });

  if (error) return { error: error.message };
  return { data };
}

export async function getAllCourses() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('order_index');

  if (error) return { error: error.message };
  return { data };
}
