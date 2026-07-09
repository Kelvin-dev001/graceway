'use client';

import ErrorState from '@/components/shared/ErrorState';

export default function LeaderError({ error, reset }) {
  return <ErrorState error={error} reset={reset} homeHref="/leader" homeLabel="Back to Leader Dashboard" />;
}
