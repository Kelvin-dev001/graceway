'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteQuiz } from '@/actions/quizzes';

export default function DeleteQuizButton({ quizId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) return;

    setError('');
    setLoading(true);
    const result = await deleteQuiz(quizId);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.refresh();
  }

  return (
    <div className="inline-flex flex-col">
      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        className="text-red-500 text-sm font-medium hover:underline disabled:opacity-50 text-left"
      >
        {loading ? 'Deleting...' : 'Delete'}
      </button>
      {error && <span className="text-xs text-red-500 mt-1">Delete failed.</span>}
    </div>
  );
}
