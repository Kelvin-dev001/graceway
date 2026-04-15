'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getLesson(lessonId) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('lessons')
    .select('*, sections(*), modules(*)')
    .eq('id', lessonId)
    .single();

  if (error) return { error: error.message };
  return { data };
}

export async function markLessonComplete(lessonId) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('lesson_progress')
    .upsert({
      user_id: user.id,
      lesson_id: lessonId,
      status: 'completed',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

  if (error) return { error: error.message };
  revalidatePath('/dashboard');
  return { success: true };
}

export async function getLessonProgress(lessonId) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null };

  const { data, error } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('lesson_id', lessonId)
    .single();

  if (error && error.code !== 'PGRST116') return { error: error.message };
  return { data };
}

export async function createLesson(formData) {
  const supabase = await createClient();
  const title = formData.get('title');
  const slug = formData.get('slug');
  const content = formData.get('content');
  const videoUrl = formData.get('video_url');
  const pdfUrl = formData.get('pdf_url');
  const sectionId = formData.get('section_id');
  const moduleId = formData.get('module_id');
  const isPublished = formData.get('is_published') === 'true';
  const durationMinutes = parseInt(formData.get('duration_minutes') || '0');

  const { data, error } = await supabase
    .from('lessons')
    .insert({
      title,
      slug,
      content,
      video_url: videoUrl,
      pdf_url: pdfUrl,
      section_id: sectionId,
      module_id: moduleId,
      is_published: isPublished,
      duration_minutes: durationMinutes,
    })
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath('/admin/lessons');
  return { data };
}

export async function updateLesson(lessonId, formData) {
  const supabase = await createClient();
  const title = formData.get('title');
  const slug = formData.get('slug');
  const content = formData.get('content');
  const videoUrl = formData.get('video_url');
  const pdfUrl = formData.get('pdf_url');
  const sectionId = formData.get('section_id');
  const moduleId = formData.get('module_id');
  const isPublished = formData.get('is_published') === 'true';
  const durationMinutes = parseInt(formData.get('duration_minutes') || '0');

  const { data, error } = await supabase
    .from('lessons')
    .update({
      title,
      slug,
      content,
      video_url: videoUrl,
      pdf_url: pdfUrl,
      section_id: sectionId,
      module_id: moduleId,
      is_published: isPublished,
      duration_minutes: durationMinutes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', lessonId)
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath('/admin/lessons');
  return { data };
}

export async function deleteLesson(lessonId) {
  const supabase = await createClient();
  const { error } = await supabase.from('lessons').delete().eq('id', lessonId);
  if (error) return { error: error.message };
  revalidatePath('/admin/lessons');
  return { success: true };
}
