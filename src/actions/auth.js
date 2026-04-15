'use server';

import { createClient } from '@/lib/supabase/server';
import { sendWelcomeEmail } from '@/lib/resend';

export async function signUp(formData) {
  const supabase = await createClient();
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
  const supabase = await createClient();
  const email = formData.get('email');
  const password = formData.get('password');

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Unable to load user after sign in.' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return {
    success: true,
    redirectTo: profile?.role === 'admin' ? '/admin' : '/dashboard',
  };
}

export async function signOut() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) return { error: error.message };
  return { success: true };
}

export async function resetPassword(formData) {
  const supabase = await createClient();
  const email = formData.get('email');

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true, message: 'Password reset email sent. Check your inbox.' };
}

export async function updatePassword(formData) {
  const supabase = await createClient();
  const password = formData.get('password');

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function updateProfile(formData) {
  const supabase = await createClient();
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
