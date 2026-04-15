'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

async function ensureAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated.' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') return { error: 'Unauthorized.' };
  return { userId: user.id };
}

export async function getAdminStats() {
  const auth = await ensureAdmin();
  if (auth.error) return { error: auth.error };

  const supabase = createAdminClient();

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
  const auth = await ensureAdmin();
  if (auth.error) return { error: auth.error };
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return { error: error.message };
  return { data };
}

export async function updateUserRole(userId, role) {
  const auth = await ensureAdmin();
  if (auth.error) return { error: auth.error };
  if (!['student', 'leader', 'admin'].includes(role)) return { error: 'Invalid role.' };
  if (auth.userId === userId && role !== 'admin') return { error: 'Cannot change your own role from admin.' };
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('profiles')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) return { error: error.message };
  revalidatePath('/admin/users');
  return { success: true };
}

export async function getAllCertificates() {
  const auth = await ensureAdmin();
  if (auth.error) return { error: auth.error };
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('certificates')
    .select('*, profiles(name, email), courses(title), modules(title)')
    .order('issued_at', { ascending: false });

  if (error) return { error: error.message };
  return { data };
}

export async function createModule(formData) {
  const auth = await ensureAdmin();
  if (auth.error) return { error: auth.error };
  const supabase = createAdminClient();
  const title = formData.get('title')?.toString().trim();
  const description = formData.get('description')?.toString().trim() || null;
  const courseId = formData.get('course_id');
  const isPublished = formData.get('is_published') === 'true';
  if (!title) return { error: 'Module title is required.' };
  if (!courseId) return { error: 'Course is required.' };

  const { data, error } = await supabase
    .from('modules')
    .insert({ title, description, course_id: courseId, is_published: isPublished })
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath('/admin/modules');
  return { data };
}

export async function getModule(moduleId) {
  const auth = await ensureAdmin();
  if (auth.error) return { error: auth.error };
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('modules')
    .select('*')
    .eq('id', moduleId)
    .single();

  if (error) return { error: error.message };
  return { data };
}

export async function updateModule(moduleId, formData) {
  const auth = await ensureAdmin();
  if (auth.error) return { error: auth.error };
  const supabase = createAdminClient();
  const title = formData.get('title')?.toString().trim();
  const description = formData.get('description')?.toString().trim() || null;
  const courseId = formData.get('course_id');
  const isPublished = formData.get('is_published') === 'true';
  if (!title) return { error: 'Module title is required.' };
  if (!courseId) return { error: 'Course is required.' };

  const { data, error } = await supabase
    .from('modules')
    .update({
      title,
      description,
      course_id: courseId,
      is_published: isPublished,
      updated_at: new Date().toISOString(),
    })
    .eq('id', moduleId)
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath('/admin/modules');
  return { data };
}

export async function deleteModule(moduleId) {
  const auth = await ensureAdmin();
  if (auth.error) return { error: auth.error };
  const supabase = createAdminClient();
  const { error } = await supabase.from('modules').delete().eq('id', moduleId);

  if (error) return { error: error.message };
  revalidatePath('/admin/modules');
  return { success: true };
}

export async function getAllModules() {
  const auth = await ensureAdmin();
  if (auth.error) return { error: auth.error };
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('modules')
    .select('*, courses(title)')
    .order('order_index');

  if (error) return { error: error.message };
  return { data };
}

export async function getAllLessons() {
  const auth = await ensureAdmin();
  if (auth.error) return { error: auth.error };
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('lessons')
    .select('*, modules(title, courses(title))')
    .order('order_index');

  if (error) return { error: error.message };
  return { data };
}

export async function getAllQuizzes() {
  const auth = await ensureAdmin();
  if (auth.error) return { error: auth.error };
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('quizzes')
    .select('*, lessons(title), modules(title), courses(title)')
    .order('created_at', { ascending: false });

  if (error) return { error: error.message };
  return { data };
}

export async function getAllCourses() {
  const auth = await ensureAdmin();
  if (auth.error) return { error: auth.error };
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('order_index');

  if (error) return { error: error.message };
  return { data };
}

export async function createSection(formData) {
  const auth = await ensureAdmin();
  if (auth.error) return { error: auth.error };
  const supabase = createAdminClient();
  const title = formData.get('title')?.toString().trim();
  const description = formData.get('description')?.toString().trim() || null;
  const moduleId = formData.get('module_id');
  if (!title) return { error: 'Section title is required.' };
  if (!moduleId) return { error: 'Module is required.' };

  const { data, error } = await supabase
    .from('sections')
    .insert({ title, description, module_id: moduleId })
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath('/admin/sections');
  return { data };
}

export async function getAllSections() {
  const auth = await ensureAdmin();
  if (auth.error) return { error: auth.error };
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('sections')
    .select('*, modules(title, courses(title))')
    .order('order_index');

  if (error) return { error: error.message };
  return { data };
}

export async function getSection(sectionId) {
  const auth = await ensureAdmin();
  if (auth.error) return { error: auth.error };
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('sections')
    .select('*')
    .eq('id', sectionId)
    .single();

  if (error) return { error: error.message };
  return { data };
}

export async function updateSection(sectionId, formData) {
  const auth = await ensureAdmin();
  if (auth.error) return { error: auth.error };
  const supabase = createAdminClient();
  const title = formData.get('title')?.toString().trim();
  const description = formData.get('description')?.toString().trim() || null;
  const moduleId = formData.get('module_id');
  if (!title) return { error: 'Section title is required.' };
  if (!moduleId) return { error: 'Module is required.' };

  const { data, error } = await supabase
    .from('sections')
    .update({
      title,
      description,
      module_id: moduleId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sectionId)
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath('/admin/sections');
  return { data };
}

export async function deleteSection(sectionId) {
  const auth = await ensureAdmin();
  if (auth.error) return { error: auth.error };
  const supabase = createAdminClient();
  const { error } = await supabase.from('sections').delete().eq('id', sectionId);

  if (error) return { error: error.message };
  revalidatePath('/admin/sections');
  return { success: true };
}

export async function deleteCertificate(certificateId) {
  const auth = await ensureAdmin();
  if (auth.error) return { error: auth.error };
  const supabase = createAdminClient();
  const { error } = await supabase.from('certificates').delete().eq('id', certificateId);
  if (error) return { error: error.message };
  revalidatePath('/admin/certificates');
  return { success: true };
}

export async function deleteUser(userId) {
  const auth = await ensureAdmin();
  if (auth.error) return { error: auth.error };
  if (auth.userId === userId) return { error: 'You cannot delete your own admin account.' };

  const supabase = createAdminClient();
  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) return { error: error.message };
  revalidatePath('/admin/users');
  return { success: true };
}
