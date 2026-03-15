'use client';

import { useState } from 'react';
import { markLessonComplete } from '@/actions/lessons';
import Button from '@/components/ui/Button';

export default function ProgressTracker({ lessonId, isCompleted, onComplete }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(isCompleted);

  async function handleComplete() {
    setLoading(true);
    const result = await markLessonComplete(lessonId);
    if (!result?.error) {
      setDone(true);
      if (onComplete) onComplete();
    }
    setLoading(false);
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="font-medium">Lesson Completed!</span>
      </div>
    );
  }

  return (
    <Button
      onClick={handleComplete}
      loading={loading}
      variant="success"
      className="w-full sm:w-auto"
    >
      Mark as Complete
    </Button>
  );
}
