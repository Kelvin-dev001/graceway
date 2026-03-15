'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { sendWelcomeEmail } from '@/lib/resend';

export async function signUp(formData) {
  const supabase = createClient();
  const name = formData.get('name');
  const email = formData.get('email');
  const password = formData.get('password');
  const referralCode = formData.get('referral_code') || null;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        referred_by: referralCode,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    try {
      await sendWelcomeEmail(email, name);
    } catch (e) {
      console.error('Welcome email failed:', e);
    }
  }

  return { success: true, message: 'Please check your email to confirm your account.' };
}

export async function signIn(formData) {
  const supabase = createClient();
  const email = formData.get('email');
  const password = formData.get('password');

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect('/dashboard');
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/');
}

export async function resetPassword(formData) {
  const supabase = createClient();
  const email = formData.get('email');

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback?next=/reset-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true, message: 'Password reset email sent. Check your inbox.' };
}

export async function updatePassword(formData) {
  const supabase = createClient();
  const password = formData.get('password');

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function updateProfile(formData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { error: 'Not authenticated' };

  const name = formData.get('name');
  const bio = formData.get('bio');
  const phone = formData.get('phone');

  const { error } = await supabase
    .from('profiles')
    .update({ name, bio, phone, updated_at: new Date().toISOString() })
    .eq('id', user.id);

  if (error) return { error: error.message };
  return { success: true };
}

export async function signInWithGoogle() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
    },
  });

  if (error) return { error: error.message };
  if (data.url) redirect(data.url);
}
