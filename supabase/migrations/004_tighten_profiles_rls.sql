-- 004_tighten_profiles_rls.sql
-- Purpose: close CLAUDE.md known bug #5 -- profiles was world-readable (USING (true))
-- and exposed email/phone to anyone. Restrict SELECT to: self, admins, and leaders
-- who are ancestors of the row's owner in the referral tree.
--
-- Mechanics: both the "am I admin" and "am I an ancestor" checks require profiles to
-- query itself from within its own SELECT policy. To avoid any ambiguity about
-- self-referencing RLS (and for consistency with this schema's existing pattern --
-- get_discipleship_tree, get_generation_stats, promote_to_leader, issue_certificate
-- are all SECURITY DEFINER), both checks are combined into ONE SECURITY DEFINER
-- helper that bypasses RLS internally and is the sole entry point for this policy.

CREATE OR REPLACE FUNCTION public.can_view_profile(p_target_id UUID)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    auth.uid() = p_target_id
    OR EXISTS (
      SELECT 1 FROM public.profiles me
      WHERE me.id = auth.uid() AND me.role = 'admin'
    )
    OR EXISTS (
      -- "ancestor leader": same prefix-match logic as get_discipleship_tree().
      -- idx_profiles_referral_path (text_pattern_ops) supports this LIKE 'prefix%'
      -- lookup with an index scan, not a sequential scan.
      SELECT 1
      FROM public.profiles viewer
      JOIN public.profiles target ON target.id = p_target_id
      WHERE viewer.id = auth.uid()
        AND target.referral_path LIKE viewer.referral_path || '%'
    );
$$;

REVOKE ALL ON FUNCTION public.can_view_profile(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_view_profile(UUID) TO authenticated, anon;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Profiles viewable by self, admins, and ancestor leaders"
  ON public.profiles
  FOR SELECT
  USING (public.can_view_profile(id));

-- ---------------------------------------------------------------------------
-- Regression fix required by tightening the policy above: validateReferralCode()
-- (src/actions/referrals.js) looks up a profile by referral_code BEFORE the
-- visitor has a session (signup flow, auth.uid() IS NULL). Under the new policy
-- this would silently return zero rows for every valid code, breaking "Recruit".
-- Expose only the two non-sensitive columns the signup flow actually needs via a
-- narrow SECURITY DEFINER function, callable by anon.
CREATE OR REPLACE FUNCTION public.get_referrer_by_code(p_code TEXT)
RETURNS TABLE (id UUID, name TEXT, referral_code TEXT)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id, name, referral_code
  FROM public.profiles
  WHERE referral_code = p_code;
$$;

REVOKE ALL ON FUNCTION public.get_referrer_by_code(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_referrer_by_code(TEXT) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Public certificate display, without exposing the recipient's profiles row.
-- certificates' own SELECT policy (migration 001) is `auth.uid() = user_id OR
-- admin` -- i.e. the certificate detail page was ALREADY broken for anonymous /
-- non-owner viewers before this task touched anything, contradicting "certificates
-- can stay publicly shareable". Do NOT widen certificates' SELECT policy to public
-- (`USING (true)`) to fix this -- that would let anyone enumerate/scrape the whole
-- certificates table. Instead, add one narrow SECURITY DEFINER function that
-- returns only the columns the public certificate page renders, given a specific
-- certificate id (the share-link UUID is the credential/token, exactly like a
-- certificate number).
CREATE OR REPLACE FUNCTION public.get_public_certificate(p_certificate_id UUID)
RETURNS TABLE (
  id UUID,
  certificate_number TEXT,
  certificate_type TEXT,
  issued_at TIMESTAMPTZ,
  pdf_url TEXT,
  course_title TEXT,
  module_title TEXT,
  recipient_name TEXT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    c.id,
    c.certificate_number,
    c.certificate_type,
    c.issued_at,
    c.pdf_url,
    co.title AS course_title,
    m.title  AS module_title,
    p.name   AS recipient_name
  FROM public.certificates c
  LEFT JOIN public.courses co ON co.id = c.course_id
  LEFT JOIN public.modules  m ON m.id = c.module_id
  JOIN public.profiles      p ON p.id = c.user_id
  WHERE c.id = p_certificate_id;
$$;

REVOKE ALL ON FUNCTION public.get_public_certificate(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_certificate(UUID) TO anon, authenticated;
