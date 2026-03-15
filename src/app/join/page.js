import { Suspense } from 'react';
import { redirect } from 'next/navigation';

function JoinRedirect({ searchParams }) {
  const ref = searchParams.ref;
  if (ref) {
    redirect(`/signup?ref=${ref}`);
  }
  redirect('/signup');
}

export default function JoinPage({ searchParams }) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400">Redirecting...</div>}>
      <JoinRedirect searchParams={searchParams} />
    </Suspense>
  );
}
