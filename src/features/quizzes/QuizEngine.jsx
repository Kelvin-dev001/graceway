'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { submitQuizAttempt } from '@/actions/quizzes';
import Button from '@/components/ui/Button';
import ExamTimer from './ExamTimer';
import QuizResults from './QuizResults';

export default function QuizEngine({ quiz, previousAttempts = [] }) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [startTime] = useState(new Date().toISOString());

  const attemptsLeft = (quiz.max_attempts || 3) - previousAttempts.length;

  async function handleSubmit() {
    if (Object.keys(answers).length < quiz.questions.length) {
      alert('Please answer all questions before submitting.');
      return;
    }
    setLoading(true);
    const res = await submitQuizAttempt(quiz.id, answers, startTime);
    setResult(res);
    setSubmitted(true);
    setLoading(false);
  }

  if (submitted && result) {
    return <QuizResults quiz={quiz} result={result} />;
  }

  if (attemptsLeft <= 0) {
    const bestAttempt = previousAttempts.reduce((best, a) => (!best || a.percentage > best.percentage ? a : best), null);
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">🚫</div>
        <h3 className="text-xl font-bold text-navy-500 mb-2">No Attempts Left</h3>
        <p className="text-gray-500">
          You have used all {quiz.max_attempts} attempts. Best score: {bestAttempt?.percentage?.toFixed(0)}%
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-navy-500">{quiz.title}</h2>
          <p className="text-gray-500">Attempt {previousAttempts.length + 1} of {quiz.max_attempts} • Pass: {quiz.passing_score}%</p>
        </div>
        {quiz.time_limit_minutes && (
          <ExamTimer minutes={quiz.time_limit_minutes} onTimeUp={handleSubmit} />
        )}
      </div>

      {quiz.questions?.map((question, qIndex) => (
        <motion.div
          key={question.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: qIndex * 0.05 }}
          className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm"
        >
          <h3 className="font-semibold text-gray-800 mb-4">
            <span className="text-orange-500 mr-2">Q{qIndex + 1}.</span>
            {question.question_text}
          </h3>
          <div className="flex flex-col gap-2">
            {question.answers?.map((answer) => (
              <button
                key={answer.id}
                onClick={() => setAnswers(prev => ({ ...prev, [question.id]: answer.id }))}
                className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all font-medium ${
                  answers[question.id] === answer.id
                    ? 'border-navy-500 bg-navy-50 text-navy-700'
                    : 'border-gray-200 hover:border-navy-300 text-gray-700'
                }`}
              >
                {answer.answer_text}
              </button>
            ))}
          </div>
        </motion.div>
      ))}

      <div className="flex items-center justify-between pt-4">
        <p className="text-sm text-gray-500">
          {Object.keys(answers).length}/{quiz.questions?.length} answered
        </p>
        <Button onClick={handleSubmit} loading={loading} size="lg">
          Submit Quiz
        </Button>
      </div>
    </div>
  );
}
