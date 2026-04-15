'use client';

import { useEffect, useState } from 'react';
import { createQuiz, replaceQuizQuestions, updateQuiz } from '@/actions/quizzes';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

const emptyQuestion = {
  question_text: '',
  question_type: 'multiple_choice',
  points: 1,
  answers: [
    { answer_text: '', is_correct: true },
    { answer_text: '', is_correct: false },
  ],
};

export default function QuizForm({ quiz, onSuccess, lessons = [], modules = [], courses = [] }) {
  const [loading, setLoading] = useState(false);
  const [savingQuestions, setSavingQuestions] = useState(false);
  const [error, setError] = useState('');
  const [questionError, setQuestionError] = useState('');
  const [quizCreated, setQuizCreated] = useState(quiz || null);
  const [quizType, setQuizType] = useState(quiz?.quiz_type || 'lesson_quiz');
  const [questions, setQuestions] = useState(
    (quiz?.questions || []).map((question) => ({
      question_text: question.question_text,
      question_type: question.question_type || 'multiple_choice',
      points: question.points || 1,
      answers: (question.answers || []).map((answer) => ({
        answer_text: answer.answer_text,
        is_correct: answer.is_correct,
      })),
    }))
  );

  useEffect(() => {
    setQuizType(quiz?.quiz_type || 'lesson_quiz');
  }, [quiz?.quiz_type]);

  async function handleCreateQuiz(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const formData = new FormData(e.target);
    const result = quiz ? await updateQuiz(quiz.id, formData) : await createQuiz(formData);
    if (result?.error) {
      setError(result.error);
    } else {
      setQuizCreated(result.data);
    }
    setLoading(false);
  }

  async function handleSaveQuestions() {
    if (!quizCreated) return;
    setSavingQuestions(true);
    setQuestionError('');

    const result = await replaceQuizQuestions(quizCreated.id, questions);
    if (result?.error) {
      setQuestionError(result.error);
      setSavingQuestions(false);
      return;
    }

    setSavingQuestions(false);
    onSuccess?.(quizCreated);
  }

  function updateQuestion(index, updates) {
    setQuestions((prev) => prev.map((question, i) => (i === index ? { ...question, ...updates } : question)));
  }

  function updateAnswer(questionIndex, answerIndex, updates) {
    setQuestions((prev) =>
      prev.map((question, i) => {
        if (i !== questionIndex) return question;
        return {
          ...question,
          answers: question.answers.map((answer, j) => {
            if (j !== answerIndex) return answer;
            return { ...answer, ...updates };
          }),
        };
      })
    );
  }

  function setCorrectAnswer(questionIndex, answerIndex) {
    setQuestions((prev) =>
      prev.map((question, i) => {
        if (i !== questionIndex) return question;
        return {
          ...question,
          answers: question.answers.map((answer, j) => ({
            ...answer,
            is_correct: j === answerIndex,
          })),
        };
      })
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleCreateQuiz} className="flex flex-col gap-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}
        <Input name="title" label="Quiz Title" defaultValue={quiz?.title} required />
        <Input name="description" label="Description" defaultValue={quiz?.description || ''} />
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Quiz Type</label>
          <select
            name="quiz_type"
            value={quizType}
            onChange={(e) => setQuizType(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-navy-500"
          >
            <option value="lesson_quiz">Lesson Quiz</option>
            <option value="module_exam">Module Exam</option>
            <option value="course_exam">Course Exam</option>
          </select>
        </div>
        <div className={quizType === 'lesson_quiz' ? '' : 'hidden'}>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Lesson</label>
          <select
            name="lesson_id"
            defaultValue={quiz?.lesson_id || ''}
            required={quizType === 'lesson_quiz'}
            disabled={quizType !== 'lesson_quiz'}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-navy-500"
          >
            <option value="">Select Lesson</option>
            {lessons.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.title}</option>)}
          </select>
        </div>
        <div className={quizType === 'module_exam' ? '' : 'hidden'}>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Module</label>
          <select
            name="module_id"
            defaultValue={quiz?.module_id || ''}
            required={quizType === 'module_exam'}
            disabled={quizType !== 'module_exam'}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-navy-500"
          >
            <option value="">Select Module</option>
            {modules.map((module) => <option key={module.id} value={module.id}>{module.title}</option>)}
          </select>
        </div>
        <div className={quizType === 'course_exam' ? '' : 'hidden'}>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Course</label>
          <select
            name="course_id"
            defaultValue={quiz?.course_id || ''}
            required={quizType === 'course_exam'}
            disabled={quizType !== 'course_exam'}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-navy-500"
          >
            <option value="">Select Course</option>
            {courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input name="passing_score" label="Passing Score (%)" type="number" defaultValue={quiz?.passing_score || '60'} min="1" max="100" />
          <Input name="max_attempts" label="Max Attempts" type="number" defaultValue={quiz?.max_attempts || '3'} min="1" max="10" />
        </div>
        <Input name="time_limit_minutes" label="Time Limit (minutes, optional)" defaultValue={quiz?.time_limit_minutes || ''} type="number" min="1" />
        <div className="flex items-center gap-2">
          <input type="checkbox" name="is_published" value="true" defaultChecked={quiz?.is_published} id="quiz_published" className="w-4 h-4 rounded" />
          <label htmlFor="quiz_published" className="text-sm font-medium text-gray-700">Published</label>
        </div>
        <Button type="submit" loading={loading} className="w-full">{quiz ? 'Save Quiz Settings' : 'Create Quiz'}</Button>
      </form>

      {quizCreated && (
        <div>
          {!quiz && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-4 text-sm">
              Quiz created! Now add questions below.
            </div>
          )}

          {questionError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">{questionError}</div>}

          <div className="flex flex-col gap-4 mb-6">
            {questions.map((question, questionIndex) => (
              <div key={`q-${questionIndex}`} className="border border-gray-200 rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-navy-500">Question {questionIndex + 1}</h4>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setQuestions((prev) => prev.filter((_, idx) => idx !== questionIndex))}
                  >
                    Remove
                  </Button>
                </div>

                <Input
                  label="Question Text"
                  value={question.question_text}
                  onChange={(e) => updateQuestion(questionIndex, { question_text: e.target.value })}
                />
                <Input
                  label="Points"
                  type="number"
                  min="1"
                  value={question.points}
                  onChange={(e) => updateQuestion(questionIndex, { points: Number(e.target.value || 1) })}
                />

                {question.answers.map((answer, answerIndex) => (
                  <div key={`q-${questionIndex}-a-${answerIndex}`} className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={answer.is_correct}
                      onChange={() => setCorrectAnswer(questionIndex, answerIndex)}
                      className="w-4 h-4"
                    />
                    <Input
                      value={answer.answer_text}
                      onChange={(e) => updateAnswer(questionIndex, answerIndex, { answer_text: e.target.value })}
                      placeholder={`Answer ${answerIndex + 1}`}
                      className="flex-1"
                    />
                  </div>
                ))}

                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    updateQuestion(questionIndex, {
                      answers: [...question.answers, { answer_text: '', is_correct: false }],
                    })
                  }
                >
                  + Add Answer
                </Button>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={() => setQuestions((prev) => [...prev, { ...emptyQuestion }])}>
              + Add Question
            </Button>
            <Button type="button" onClick={handleSaveQuestions} loading={savingQuestions} variant="success" className="w-full">
              Save Questions
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
