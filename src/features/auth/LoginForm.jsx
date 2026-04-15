'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { signIn } from '@/actions/auth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const formData = new FormData(e.target);
    try {
      const result = await signIn(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      if (result?.success) {
        router.push(result.redirectTo || '/dashboard');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md mx-auto"
    >
      <h2 className="text-2xl font-bold text-navy-500 mb-2">Welcome back</h2>
      <p className="text-gray-500 mb-6">Sign in to continue your discipleship journey</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input name="email" type="email" label="Email" placeholder="you@example.com" required />
        <Input name="password" type="password" label="Password" placeholder="••••••••" required />

        <div className="text-right">
          <Link href="/reset-password" className="text-sm text-navy-500 hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" loading={loading} className="w-full">
          Sign In
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-navy-500 font-semibold hover:underline">
          Sign up free
        </Link>
      </p>
    </motion.div>
  );
}
