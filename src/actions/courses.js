'use server';

import { createClient } from '@/lib/supabase/server';
import { slugify } from '@/lib/utils';
import { revalidatePath } from 'next/cache';

export async function getCourses() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('is_published', true)
    .order('order_index');

  if (error) return { error: error.message };
  return { data };
}

export async function getCourse(courseId) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('courses')
    .select(`
      *,
      modules (
        *,
        sections (
          *,
          lessons (*)
        )
      )
    `)
    .eq('id', courseId)
    .single();

  if (error) return { error: error.message };
  return { data };
}

export async function enrollInCourse(courseId) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('enrollments')
    .upsert({ user_id: user.id, course_id: courseId, status: 'active' });

  if (error) return { error: error.message };
  revalidatePath('/courses');
  return { success: true };
}

export async function getEnrollments() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [] };

  const { data, error } = await supabase
    .from('enrollments')
    .select('*, courses(*)')
    .eq('user_id', user.id);

  if (error) return { error: error.message };
  return { data };
}

export async function createCourse(formData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const title = formData.get('title');
  const description = formData.get('description');
  const slug = formData.get('slug') || slugify(title);
  const thumbnail = formData.get('thumbnail');
  const isPublished = formData.get('is_published') === 'true';

  const { data, error } = await supabase
    .from('courses')
    .insert({ title, description, slug, thumbnail, is_published: isPublished, created_by: user.id })
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath('/admin/courses');
  return { data };
}

export async function updateCourse(courseId, formData) {
  const supabase = await createClient();
  const title = formData.get('title');
  const description = formData.get('description');
  const slug = formData.get('slug');
  const thumbnail = formData.get('thumbnail');
  const isPublished = formData.get('is_published') === 'true';

  const { data, error } = await supabase
    .from('courses')
    .update({ title, description, slug, thumbnail, is_published: isPublished, updated_at: new Date().toISOString() })
    .eq('id', courseId)
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath('/admin/courses');
  return { data };
}

export async function deleteCourse(courseId) {
  const supabase = await createClient();
  const { error } = await supabase.from('courses').delete().eq('id', courseId);
  if (error) return { error: error.message };
  revalidatePath('/admin/courses');
  return { success: true };
}
