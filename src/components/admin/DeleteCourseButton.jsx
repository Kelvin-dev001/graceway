'use client';

import { useState } from 'react';
import { deleteCourse } from '@/actions/courses';
import { useRouter } from 'next/navigation';

export default function DeleteCourseButton({ courseId }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const result = await deleteCourse(courseId);
      if (result?.error) {
        alert('Failed to delete course: ' + result.error);
        setLoading(false);
      } else {
        router.refresh();
      }
    } catch (err) {
      alert('Failed to delete course: ' + err.message);
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
