'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function QuizResults({ quiz, result }) {
  const { passed, percentage, score, totalPoints } = result;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-8"
    >
      <div className="text-6xl mb-4">{passed ? '🎉' : '😔'}</div>
      <h2 className="text-3xl font-bold text-navy-500 mb-2">
        {passed ? 'Congratulations!' : 'Keep Trying!'}
      </h2>
      <p className="text-gray-500 mb-6">
        {passed ? 'You passed the quiz!' : `You need ${quiz.passing_score}% to pass.`}
      </p>

      <div className="inline-flex items-center justify-center w-32 h-32 rounded-full border-8 border-gray-100 mb-6">
        <div>
          <div className={`text-3xl font-extrabold ${passed ? 'text-green-500' : 'text-red-500'}`}>
            {Math.round(percentage)}%
          </div>
          <div className="text-xs text-gray-400">{score}/{totalPoints} pts</div>
        </div>
      </div>

      <div className={`inline-block px-6 py-2 rounded-full text-sm font-bold mb-8 ${passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
        {passed ? '✓ PASSED' : '✗ FAILED'}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/dashboard">
          <Button variant="secondary">Back to Dashboard</Button>
        </Link>
        {!passed && (
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        )}
      </div>
    </motion.div>
  );
}
