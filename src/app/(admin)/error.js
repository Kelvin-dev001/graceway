'use client';

import ErrorState from '@/components/shared/ErrorState';

export default function AdminError({ error, reset }) {
  return <ErrorState error={error} reset={reset} homeHref="/admin" homeLabel="Back to Admin Dashboard" />;
}
