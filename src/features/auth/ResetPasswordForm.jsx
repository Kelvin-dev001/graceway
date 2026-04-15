'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { resetPassword } from '@/actions/auth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('request');
  const [recovering, setRecovering] = useState(true);

  useEffect(() => {
    async function setupRecoverySession() {
      setRecovering(true);
      const hashParams = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.hash.replace(/^#/, ''))
        : new URLSearchParams();
      const accessToken = searchParams.get('access_token') || hashParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token') || hashParams.get('refresh_token');
      const type = searchParams.get('type') || hashParams.get('type');

      if (accessToken && refreshToken && type === 'recovery') {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError) {
          setError(sessionError.message);
          setMode('request');
        } else {
          setMode('update');
          if (typeof window !== 'undefined' && window.location.hash) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        }
        setRecovering(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setMode('update');
      } else {
        setMode('request');
      }
      setRecovering(false);
    }

    setupRecoverySession();
  }, [searchParams, supabase]);

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

  async function handleUpdatePassword(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const formData = new FormData(e.target);
    const password = formData.get('password')?.toString() || '';
    const confirmPassword = formData.get('confirm_password')?.toString() || '';

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setSuccess('Password updated successfully. Redirecting to sign in...');
    setLoading(false);
    setTimeout(() => router.push('/login'), 1200);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md mx-auto"
    >
      <h2 className="text-2xl font-bold text-navy-500 mb-2">Reset Password</h2>
      <p className="text-gray-500 mb-6">
        {mode === 'update' ? 'Set your new password' : 'Enter your email to receive a reset link'}
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
          {error}
        </div>
      )}

      {recovering ? (
        <div className="text-sm text-gray-500">Preparing secure reset session...</div>
      ) : success ? (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl">
          <p className="font-medium">{mode === 'update' ? 'Success!' : 'Email sent!'}</p>
          <p className="text-sm mt-1">{success}</p>
        </div>
      ) : mode === 'update' ? (
        <form onSubmit={handleUpdatePassword} className="flex flex-col gap-4">
          <Input name="password" type="password" label="New Password" placeholder="Minimum 8 characters" required />
          <Input name="confirm_password" type="password" label="Confirm Password" placeholder="Re-enter password" required />
          <Button type="submit" loading={loading} className="w-full">
            Update Password
          </Button>
        </form>
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
