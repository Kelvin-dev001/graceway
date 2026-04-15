'use client';

import { useState } from 'react';
import { createQuiz, createQuestion, updateQuiz } from '@/actions/quizzes';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function QuizForm({ quiz, onSuccess, lessons = [], modules = [] }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [quizCreated, setQuizCreated] = useState(quiz || null);
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState({ text: '', type: 'multiple_choice', answers: [{ text: '', correct: false }, { text: '', correct: false }] });

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
      if (quiz) {
        onSuccess?.(result.data);
        setLoading(false);
        return;
      }
    }
    setLoading(false);
  }

  async function handleAddQuestion() {
    if (!quizCreated) return;
    const result = await createQuestion(quizCreated.id, {
      question_text: newQuestion.text,
      question_type: newQuestion.type,
      answers: newQuestion.answers.map(a => ({ answer_text: a.text, is_correct: a.correct })),
    });
    if (!result?.error) {
      setQuestions(prev => [...prev, result.data]);
      setNewQuestion({ text: '', type: 'multiple_choice', answers: [{ text: '', correct: false }, { text: '', correct: false }] });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {!quizCreated || quiz ? (
        <form onSubmit={handleCreateQuiz} className="flex flex-col gap-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}
          <Input name="title" label="Quiz Title" defaultValue={quiz?.title} required />
          <Input name="description" label="Description" defaultValue={quiz?.description || ''} />
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Quiz Type</label>
            <select name="quiz_type" defaultValue={quiz?.quiz_type || 'lesson_quiz'} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-navy-500">
              <option value="lesson_quiz">Lesson Quiz</option>
              <option value="module_exam">Module Exam</option>
              <option value="course_exam">Course Exam</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Lesson (optional)</label>
              <select name="lesson_id" defaultValue={quiz?.lesson_id || ''} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-navy-500">
                <option value="">Select Lesson</option>
                {lessons.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.title}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Module (optional)</label>
              <select name="module_id" defaultValue={quiz?.module_id || ''} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-navy-500">
                <option value="">Select Module</option>
                {modules.map((module) => <option key={module.id} value={module.id}>{module.title}</option>)}
              </select>
            </div>
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
          <Button type="submit" loading={loading} className="w-full">{quiz ? 'Update Quiz' : 'Create Quiz'}</Button>
        </form>
      ) : (
        <div>
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-4 text-sm">
            Quiz created! Now add questions below.
          </div>

          <div className="flex flex-col gap-3 mb-6">
            {questions.map((q, i) => (
              <div key={q.id} className="bg-gray-50 rounded-xl p-3 text-sm">
                <span className="font-medium">Q{i+1}:</span> {q.question_text}
              </div>
            ))}
          </div>

          <div className="border border-gray-200 rounded-2xl p-4 flex flex-col gap-3">
            <h4 className="font-semibold text-navy-500">Add Question</h4>
            <Input
              label="Question Text"
              value={newQuestion.text}
              onChange={(e) => setNewQuestion(prev => ({ ...prev, text: e.target.value }))}
            />
            {newQuestion.answers.map((a, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={a.correct}
                  onChange={() => setNewQuestion(prev => ({
                    ...prev,
                    answers: prev.answers.map((ans, idx) => ({ ...ans, correct: idx === i }))
                  }))}
                  className="w-4 h-4"
                />
                <Input
                  value={a.text}
                  onChange={(e) => setNewQuestion(prev => ({
                    ...prev,
                    answers: prev.answers.map((ans, idx) => idx === i ? { ...ans, text: e.target.value } : ans)
                  }))}
                  placeholder={`Answer ${i + 1}`}
                  className="flex-1"
                />
              </div>
            ))}
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setNewQuestion(prev => ({
                ...prev,
                answers: [...prev.answers, { text: '', correct: false }]
              }))}>
                + Add Answer
              </Button>
              <Button size="sm" onClick={handleAddQuestion}>Add Question</Button>
            </div>
          </div>

          <Button onClick={() => onSuccess?.(quizCreated)} variant="success" className="w-full mt-4">
            Finish Quiz
          </Button>
        </div>
      )}
    </div>
  );
}
