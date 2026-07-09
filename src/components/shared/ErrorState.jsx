'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function ErrorState({
  error,
  reset,
  homeHref = '/dashboard',
  homeLabel = 'Back to Dashboard',
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      <h2 className="text-xl font-bold text-navy-500 mb-2">Something went wrong</h2>
      <p className="text-sm text-gray-500 mb-6 max-w-md">
        {error?.message || 'An unexpected error occurred. Please try again.'}
      </p>
      <div className="flex gap-3">
        <Button onClick={reset} variant="primary">Try again</Button>
        <Link
          href={homeHref}
          className="px-5 py-2.5 rounded-xl font-semibold text-navy-500 border-2 border-navy-500 hover:bg-navy-500 hover:text-white transition-colors"
        >
          {homeLabel}
        </Link>
      </div>
    </div>
  );
}
