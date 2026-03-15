import { Suspense } from 'react';
import SignupForm from '@/features/auth/SignupForm';

export const metadata = { title: 'Sign Up — Graceway' };

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-500 to-teal-500 flex items-center justify-center p-4 pt-20">
      <Suspense fallback={<div className="text-white">Loading...</div>}>
        <SignupForm />
      </Suspense>
    </div>
  );
}
