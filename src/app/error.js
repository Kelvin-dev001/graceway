'use client';

import ErrorState from '@/components/shared/ErrorState';

export default function RootError({ error, reset }) {
  return <ErrorState error={error} reset={reset} homeHref="/" homeLabel="Back to Home" />;
}
