import Link from 'next/link';

export const metadata = { title: 'Verify Email — Graceway' };

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-500 to-teal-500 flex items-center justify-center p-4 pt-20">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="text-5xl mb-4">📧</div>
        <h2 className="text-2xl font-bold text-navy-500 mb-2">Check Your Email</h2>
        <p className="text-gray-500 mb-6">
          We sent a verification link to your email address. Click the link to verify your account and get started.
        </p>
        <Link href="/login" className="text-navy-500 font-semibold hover:underline">
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}
