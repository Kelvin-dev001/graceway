'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { resetPassword } from '@/actions/auth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function ResetPasswordForm() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const formData = new FormData(e.target);
    const result = await resetPassword(formData);
    if (result?.error) {
      setError(result.error);
    } else if (result?.success) {
      setSuccess(result.message);
    }
    setLoading(false);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md mx-auto"
    >
      <h2 className="text-2xl font-bold text-navy-500 mb-2">Reset Password</h2>
      <p className="text-gray-500 mb-6">Enter your email to receive a reset link</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
          {error}
        </div>
      )}

      {success ? (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl">
          <p className="font-medium">Email sent!</p>
          <p className="text-sm mt-1">{success}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input name="email" type="email" label="Email" placeholder="you@example.com" required />
          <Button type="submit" loading={loading} className="w-full">
            Send Reset Link
          </Button>
        </form>
      )}

      <p className="text-center text-sm text-gray-500 mt-6">
        Remember your password?{' '}
        <Link href="/login" className="text-navy-500 font-semibold hover:underline">
          Sign in
        </Link>
      </p>
    </motion.div>
  );
}
