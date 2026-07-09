'use client';

import ErrorState from '@/components/shared/ErrorState';

export default function DashboardError({ error, reset }) {
  return <ErrorState error={error} reset={reset} homeHref="/dashboard" homeLabel="Back to Dashboard" />;
}
