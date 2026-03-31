'use client';

import { useState } from 'react';
import { deleteLesson } from '@/actions/lessons';
import { useRouter } from 'next/navigation';

export default function DeleteLessonButton({ lessonId }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this lesson? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const result = await deleteLesson(lessonId);
      if (result?.error) {
        alert('Failed to delete lesson: ' + result.error);
        setLoading(false);
      } else {
        router.refresh();
      }
    } catch (err) {
      alert('Failed to delete lesson: ' + err.message);
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="text-red-500 text-sm font-medium hover:underline disabled:opacity-50"
    >
      {loading ? 'Deleting...' : 'Delete'}
    </button>
  );
}
