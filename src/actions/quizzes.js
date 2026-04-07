'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getQuiz(quizId) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('quizzes')
    .select('*, questions(*, answers(*))')
    .eq('id', quizId)
    .single();

  if (error) return { error: error.message };
  return { data };
}

export async function submitQuizAttempt(quizId, answers, startedAt) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  // Check attempt count
  const { data: attempts } = await supabase
    .from('quiz_attempts')
    .select('id')
    .eq('quiz_id', quizId)
    .eq('user_id', user.id);

  const { data: quiz } = await supabase
    .from('quizzes')
    .select('*, questions(*, answers(*))')
    .eq('id', quizId)
    .single();

  if (attempts && attempts.length >= (quiz?.max_attempts || 3)) {
    return { error: 'Maximum attempts reached' };
  }

  // Grade answers
  let score = 0;
  let totalPoints = 0;

  quiz.questions.forEach((question) => {
    const userAnswer = answers[question.id];
    const correctAnswer = question.answers.find((a) => a.is_correct);
    totalPoints += question.points;
    if (userAnswer === correctAnswer?.id) {
      score += question.points;
    }
  });

  const percentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0;
  const passed = percentage >= (quiz.passing_score || 60);

  const { data: attempt, error } = await supabase
    .from('quiz_attempts')
    .insert({
      quiz_id: quizId,
      user_id: user.id,
      score,
      total_points: totalPoints,
      percentage,
      passed,
      answers,
      started_at: startedAt,
      completed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return { error: error.message };
  return { data: attempt, passed, score, totalPoints, percentage };
}

export async function getQuizAttempts(quizId) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [] };

  const { data, error } = await supabase
    .from('quiz_attempts')
    .select('*')
    .eq('quiz_id', quizId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return { error: error.message };
  return { data };
}

export async function createQuiz(formData) {
  const supabase = await createClient();
  const title = formData.get('title');
  const description = formData.get('description');
  const quizType = formData.get('quiz_type') || 'lesson_quiz';
  const passingScore = parseInt(formData.get('passing_score') || '60');
  const timeLimitMinutes = formData.get('time_limit_minutes') ? parseInt(formData.get('time_limit_minutes')) : null;
  const maxAttempts = parseInt(formData.get('max_attempts') || '3');
  const lessonId = formData.get('lesson_id') || null;
  const moduleId = formData.get('module_id') || null;
  const isPublished = formData.get('is_published') === 'true';

  const { data, error } = await supabase
    .from('quizzes')
    .insert({
      title,
      description,
      quiz_type: quizType,
      passing_score: passingScore,
      time_limit_minutes: timeLimitMinutes,
      max_attempts: maxAttempts,
      lesson_id: lessonId,
      module_id: moduleId,
      is_published: isPublished,
    })
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath('/admin/quizzes');
  return { data };
}

export async function createQuestion(quizId, questionData) {
  const supabase = await createClient();
  const { question_text, question_type, points, explanation, answers } = questionData;

  const { data: question, error: questionError } = await supabase
    .from('questions')
    .insert({ quiz_id: quizId, question_text, question_type, points: points || 1, explanation })
    .select()
    .single();

  if (questionError) return { error: questionError.message };

  if (answers && answers.length > 0) {
    const answersData = answers.map((a, i) => ({
      question_id: question.id,
      answer_text: a.answer_text,
      is_correct: a.is_correct || false,
      order_index: i,
    }));

    const { error: answersError } = await supabase.from('answers').insert(answersData);
    if (answersError) return { error: answersError.message };
  }

  return { data: question };
}
