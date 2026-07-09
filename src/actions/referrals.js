'use server';

import { createClient } from '@/lib/supabase/server';

export async function getReferralStats() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null };

  const { data: profile } = await supabase
    .from('profiles')
    .select('referral_code, referral_path, generation_level')
    .eq('id', user.id)
    .single();

  if (!profile) return { data: null };

  const { data: referrals, error } = await supabase
    .from('profiles')
    .select('id, name, email, created_at, role')
    .eq('referred_by', user.id);

  if (error) return { error: error.message };

  return {
    data: {
      referralCode: profile.referral_code,
      totalReferrals: referrals?.length || 0,
      referrals: referrals || [],
    },
  };
}

export async function validateReferralCode(code) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_referrer_by_code', { p_code: code });

  const referrer = data?.[0];
  if (error || !referrer) return { valid: false };
  return { valid: true, referrer };
}
