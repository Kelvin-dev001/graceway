'use server';

import { createClient } from '@/lib/supabase/server';
import { slugify } from '@/lib/utils';
import { revalidatePath } from 'next/cache';
import { getCourseProgressMap, calculateProgress } from '@/lib/progress';
import { issueCertificate } from '@/actions/certificates';

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
    .order('order_index', { foreignTable: 'modules' })
    .order('order_index', { foreignTable: 'modules.sections' })
    .order('order_index', { foreignTable: 'modules.sections.lessons' })
    .single();

  if (error) return { error: error.message };

  if (data?.modules) {
    data.modules.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
    data.modules.forEach((m) => {
      m.sections?.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
      m.sections?.forEach((s) => {
        s.lessons?.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
      });
    });
  }

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

export async function recomputeCourseCompletion(userId, courseId) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };
  if (user.id !== userId) return { error: 'You can only recompute your own course completion.' };

  const { data: enrollment, error: enrollmentError } = await supabase
    .from('enrollments')
    .select('id, status, progress_percentage')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle();
  if (enrollmentError) return { error: enrollmentError.message };
  if (!enrollment) return { error: 'No enrollment found for this user and course.' };

  const progressMap = await getCourseProgressMap({ supabase, userId, courseIds: [courseId] });
  const { totalLessons = 0, completedLessons = 0 } = progressMap[courseId] || {};
  const progress = calculateProgress(completedLessons, totalLessons);

  let shouldMarkCompletedNow = false;
  if (progress === 100 && enrollment.status !== 'completed') {
    const { data: courseExam, error: examError } = await supabase
      .from('quizzes')
      .select('id')
      .eq('course_id', courseId)
      .eq('quiz_type', 'course_exam')
      .limit(1)
      .maybeSingle();
    if (examError) return { error: examError.message };

    if (!courseExam) {
      shouldMarkCompletedNow = true;
    } else {
      const { data: passedAttempt, error: attemptError } = await supabase
        .from('quiz_attempts')
        .select('id')
        .eq('quiz_id', courseExam.id)
        .eq('user_id', userId)
        .eq('passed', true)
        .limit(1)
        .maybeSingle();
      if (attemptError) return { error: attemptError.message };
      shouldMarkCompletedNow = Boolean(passedAttempt);
    }
  }

  const updatePayload = { progress_percentage: progress };
  if (shouldMarkCompletedNow) {
    updatePayload.status = 'completed';
    updatePayload.completed_at = new Date().toISOString();
  }
  const { error: updateError } = await supabase
    .from('enrollments')
    .update(updatePayload)
    .eq('user_id', userId)
    .eq('course_id', courseId);
  if (updateError) return { error: updateError.message };

  let certificateIssued = false;
  if (shouldMarkCompletedNow) {
    const certResult = await issueCertificate(userId, courseId, null, 'course');
    if (certResult.error) return { error: certResult.error };
    certificateIssued = true;
  }

  revalidatePath('/dashboard');
  revalidatePath(`/courses/${courseId}`);
  return {
    data: {
      progress,
      completed: enrollment.status === 'completed' || shouldMarkCompletedNow,
      certificateIssued,
    },
  };
}

export async function createCourse(formData) {
  const auth = await ensureAdmin();
  if (auth.error) return { error: auth.error };

  const supabase = await createClient();

  const title = formData.get('title')?.toString().trim();
  const description = formData.get('description')?.toString().trim() || null;
  const slug = formData.get('slug')?.toString().trim() || slugify(title);
  const thumbnail = formData.get('thumbnail')?.toString().trim() || null;
  const isPublished = formData.get('is_published') === 'true';
  const orderIndex = parseInt(formData.get('order_index') ?? '0', 10);
  if (!title) return { error: 'Course title is required.' };
  if (!slug) return { error: 'Course slug is required.' };
  if (Number.isNaN(orderIndex) || orderIndex < 0) return { error: 'Order must be 0 or greater.' };

  const { data, error } = await supabase
    .from('courses')
    .insert({ title, description, slug, thumbnail, is_published: isPublished, order_index: orderIndex, created_by: auth.userId })
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath('/admin/courses');
  return { data };
}

export async function updateCourse(courseId, formData) {
  const auth = await ensureAdmin();
  if (auth.error) return { error: auth.error };

  const supabase = await createClient();
  const title = formData.get('title')?.toString().trim();
  const description = formData.get('description')?.toString().trim() || null;
  const slug = formData.get('slug')?.toString().trim() || slugify(title);
  const thumbnail = formData.get('thumbnail')?.toString().trim() || null;
  const isPublished = formData.get('is_published') === 'true';
  const orderIndex = parseInt(formData.get('order_index') ?? '0', 10);
  if (!title) return { error: 'Course title is required.' };
  if (!slug) return { error: 'Course slug is required.' };
  if (Number.isNaN(orderIndex) || orderIndex < 0) return { error: 'Order must be 0 or greater.' };

  const { data, error } = await supabase
    .from('courses')
    .update({ title, description, slug, thumbnail, is_published: isPublished, order_index: orderIndex, updated_at: new Date().toISOString() })
    .eq('id', courseId)
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath('/admin/courses');
  return { data };
}

export async function deleteCourse(courseId) {
  const auth = await ensureAdmin();
  if (auth.error) return { error: auth.error };

  const supabase = await createClient();
  const { count: moduleCount } = await supabase
    .from('modules')
    .select('*', { count: 'exact', head: true })
    .eq('course_id', courseId);
  const { error } = await supabase.from('courses').delete().eq('id', courseId);
  if (error) return { error: error.message };
  revalidatePath('/admin/courses');
  return { success: true, message: moduleCount ? `Deleted course and ${moduleCount} dependent module(s).` : 'Deleted course.' };
}
