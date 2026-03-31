'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { signUp } from '@/actions/auth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function SignupForm() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const refCode = searchParams.get('ref') || '';

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const formData = new FormData(e.target);
    const result = await signUp(formData);
    if (result?.error) {
      setError(result.error);
    } else if (result?.success) {
      setSuccess(result.message || 'Please check your email to confirm your account.');
    }
    setLoading(false);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md mx-auto"
    >
      <h2 className="text-2xl font-bold text-navy-500 mb-2">Join Graceway</h2>
      <p className="text-gray-500 mb-6">Start your discipleship journey today</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
          {error}
        </div>
      )}

      {success ? (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
          {success}
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input name="name" label="Full Name" placeholder="Your full name" required />
            <Input name="email" type="email" label="Email" placeholder="you@example.com" required />
            <Input name="password" type="password" label="Password" placeholder="Min 8 characters" required />

            {refCode && (
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
                🎉 You were invited! Referral code: <strong>{refCode}</strong>
                <input type="hidden" name="referral_code" value={refCode} />
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full">
              Create Account
            </Button>
          </form>
        </>
      )}

      <p className="text-center text-sm text-gray-500 mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-navy-500 font-semibold hover:underline">
          Sign in
        </Link>
      </p>
    </motion.div>
  );
}
