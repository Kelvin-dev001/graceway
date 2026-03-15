'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useReferrals() {
  const [referralData, setReferralData] = useState(null);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const fetchReferrals = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('id', user.id)
        .single();

      const { data: referrals } = await supabase
        .from('profiles')
        .select('id, name, email, created_at, role')
        .eq('referred_by', user.id);

      setReferralData({
        referralCode: profile?.referral_code,
        totalReferrals: referrals?.length || 0,
        referrals: referrals || [],
      });
      setLoading(false);
    };

    fetchReferrals();
  }, [supabase]);

  return { referralData, loading };
}
