'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getQuiz(quizId) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('quizzes')
    .select('*, lessons(title), modules(title), courses(title), questions(*, answers(*))')
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
  const title = formData.get('title')?.toString().trim();
  const description = formData.get('description')?.toString().trim() || null;
  const quizType = formData.get('quiz_type') || 'lesson_quiz';
  const passingScore = parseInt(formData.get('passing_score') || '60');
  const timeLimitMinutes = formData.get('time_limit_minutes') ? parseInt(formData.get('time_limit_minutes')) : null;
  const maxAttempts = parseInt(formData.get('max_attempts') || '3');
  const lessonId = formData.get('lesson_id') || null;
  const moduleId = formData.get('module_id') || null;
  const courseId = formData.get('course_id') || null;
  const isPublished = formData.get('is_published') === 'true';

  if (!title) return { error: 'Quiz title is required.' };
  if (Number.isNaN(passingScore) || passingScore < 1 || passingScore > 100) {
    return { error: 'Passing score must be between 1 and 100.' };
  }
  if (Number.isNaN(maxAttempts) || maxAttempts < 1 || maxAttempts > 10) {
    return { error: 'Max attempts must be between 1 and 10.' };
  }
  if (timeLimitMinutes !== null && (Number.isNaN(timeLimitMinutes) || timeLimitMinutes < 1)) {
    return { error: 'Time limit must be a positive number.' };
  }
  if (quizType === 'lesson_quiz' && !lessonId) return { error: 'Please select a lesson for lesson quiz.' };
  if (quizType === 'module_exam' && !moduleId) return { error: 'Please select a module for module exam.' };
  if (quizType === 'course_exam' && !courseId) return { error: 'Please select a course for course exam.' };

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
      course_id: courseId,
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

export async function updateQuiz(quizId, formData) {
  const supabase = await createClient();
  const title = formData.get('title')?.toString().trim();
  const description = formData.get('description')?.toString().trim() || null;
  const quizType = formData.get('quiz_type') || 'lesson_quiz';
  const passingScore = parseInt(formData.get('passing_score') || '60');
  const timeLimitMinutes = formData.get('time_limit_minutes') ? parseInt(formData.get('time_limit_minutes')) : null;
  const maxAttempts = parseInt(formData.get('max_attempts') || '3');
  const lessonId = formData.get('lesson_id') || null;
  const moduleId = formData.get('module_id') || null;
  const courseId = formData.get('course_id') || null;
  const isPublished = formData.get('is_published') === 'true';

  if (!title) return { error: 'Quiz title is required.' };
  if (Number.isNaN(passingScore) || passingScore < 1 || passingScore > 100) {
    return { error: 'Passing score must be between 1 and 100.' };
  }
  if (Number.isNaN(maxAttempts) || maxAttempts < 1 || maxAttempts > 10) {
    return { error: 'Max attempts must be between 1 and 10.' };
  }
  if (timeLimitMinutes !== null && (Number.isNaN(timeLimitMinutes) || timeLimitMinutes < 1)) {
    return { error: 'Time limit must be a positive number.' };
  }
  if (quizType === 'lesson_quiz' && !lessonId) return { error: 'Please select a lesson for lesson quiz.' };
  if (quizType === 'module_exam' && !moduleId) return { error: 'Please select a module for module exam.' };
  if (quizType === 'course_exam' && !courseId) return { error: 'Please select a course for course exam.' };

  const { data, error } = await supabase
    .from('quizzes')
    .update({
      title,
      description,
      quiz_type: quizType,
      passing_score: passingScore,
      time_limit_minutes: timeLimitMinutes,
      max_attempts: maxAttempts,
      lesson_id: lessonId,
      module_id: moduleId,
      course_id: courseId,
      is_published: isPublished,
      updated_at: new Date().toISOString(),
    })
    .eq('id', quizId)
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath('/admin/quizzes');
  return { data };
}

export async function deleteQuiz(quizId) {
  const supabase = await createClient();
  const { error } = await supabase.from('quizzes').delete().eq('id', quizId);
  if (error) return { error: error.message };
  revalidatePath('/admin/quizzes');
  return { success: true };
}

export async function replaceQuizQuestions(quizId, questions = []) {
  const supabase = await createClient();

  if (!quizId) return { error: 'Quiz ID is required.' };

  const sanitizedQuestions = (questions || []).map((question, qIndex) => ({
    question_text: question.question_text?.toString().trim() || '',
    question_type: question.question_type || 'multiple_choice',
    points: Number(question.points || 1),
    explanation: question.explanation?.toString().trim() || null,
    order_index: qIndex,
    answers: (question.answers || []).map((answer, aIndex) => ({
      answer_text: answer.answer_text?.toString().trim() || '',
      is_correct: Boolean(answer.is_correct),
      order_index: aIndex,
    })),
  }));

  for (const question of sanitizedQuestions) {
    if (!question.question_text) return { error: 'Each question must have text.' };
    if (!question.answers.length || question.answers.some((answer) => !answer.answer_text)) {
      return { error: 'Each question must have non-empty answer options.' };
    }
    if (!question.answers.some((answer) => answer.is_correct)) {
      return { error: 'Each question must have one correct answer.' };
    }
  }

  const { data: existingQuestions, error: fetchError } = await supabase
    .from('questions')
    .select('id')
    .eq('quiz_id', quizId);
  if (fetchError) return { error: fetchError.message };

  const existingQuestionIds = (existingQuestions || []).map((question) => question.id);
  if (existingQuestionIds.length > 0) {
    const { error: deleteAnswersError } = await supabase.from('answers').delete().in('question_id', existingQuestionIds);
    if (deleteAnswersError) return { error: deleteAnswersError.message };
  }

  const { error: deleteQuestionsError } = await supabase.from('questions').delete().eq('quiz_id', quizId);
  if (deleteQuestionsError) return { error: deleteQuestionsError.message };

  for (const question of sanitizedQuestions) {
    const { data: createdQuestion, error: questionError } = await supabase
      .from('questions')
      .insert({
        quiz_id: quizId,
        question_text: question.question_text,
        question_type: question.question_type,
        points: question.points,
        explanation: question.explanation,
        order_index: question.order_index,
      })
      .select('id')
      .single();

    if (questionError) return { error: questionError.message };

    const { error: answersError } = await supabase.from('answers').insert(
      question.answers.map((answer) => ({
        question_id: createdQuestion.id,
        answer_text: answer.answer_text,
        is_correct: answer.is_correct,
        order_index: answer.order_index,
      }))
    );

    if (answersError) return { error: answersError.message };
  }

  revalidatePath('/admin/quizzes');
  revalidatePath(`/admin/quizzes/${quizId}/edit`);
  revalidatePath(`/admin/quizzes/${quizId}`);
  return { success: true };
}
