import { Suspense } from 'react';
import ResetPasswordForm from '@/features/auth/ResetPasswordForm';

export const metadata = { title: 'Reset Password — Graceway' };

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-500 to-teal-500 flex items-center justify-center p-4 pt-20">
      <Suspense fallback={<div className="text-white">Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
