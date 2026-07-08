-- 003_certificate_constraints.sql
-- Purpose: make certificate issuance idempotent per (user, course) and (user, module),
-- and document the intentional NO ACTION delete-blocking behavior on course_id/module_id.
-- Related: CLAUDE.md known bugs #1, #2, #18.

-- 1. Performance: certificates are looked up by user_id constantly (getCertificates,
--    and the "auth.uid() = user_id" RLS checks). No index existed on it before this.
CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON public.certificates(user_id);

-- 2. Idempotency constraints.
--    course_id/module_id are nullable and mutually exclusive per certificate_type.
--    Partial unique indexes (rather than a plain UNIQUE(user_id, course_id)) make the
--    "only applies when this id is actually set" intent explicit and give
--    issue_certificate() below a precise ON CONFLICT target.
--
--    Pre-flight (run manually first -- on a fresh project this returns zero rows,
--    but confirm before applying against any environment with real data):
--      SELECT user_id, course_id, COUNT(*) FROM public.certificates
--        WHERE course_id IS NOT NULL GROUP BY user_id, course_id HAVING COUNT(*) > 1;
--      SELECT user_id, module_id, COUNT(*) FROM public.certificates
--        WHERE module_id IS NOT NULL GROUP BY user_id, module_id HAVING COUNT(*) > 1;

CREATE UNIQUE INDEX IF NOT EXISTS certificates_user_course_unique
  ON public.certificates (user_id, course_id)
  WHERE course_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS certificates_user_module_unique
  ON public.certificates (user_id, module_id)
  WHERE module_id IS NOT NULL;

-- 3. Document the standing NO ACTION behavior on certificates.course_id / .module_id.
--    These FKs were declared without ON DELETE in 001_initial_schema.sql, so Postgres
--    defaults to NO ACTION: deleting a course/module that has an issued certificate
--    raises a foreign-key-violation error and the delete is blocked. This is
--    intentional, not a bug -- a certificate is an audit/compliance record and must
--    not silently disappear or be orphaned when the underlying course is later
--    deleted. deleteCourse() in src/actions/courses.js must surface this FK error to
--    the admin instead of assuming module-cascade implies certificate-cascade.
--    See CLAUDE.md known bug #18.
--
--    NOTE: these COMMENT ON CONSTRAINT calls assume Postgres's default
--    auto-generated FK name (<table>_<column>_fkey). Verify before relying on this:
--      SELECT conname FROM pg_constraint
--        WHERE conrelid = 'public.certificates'::regclass AND contype = 'f';

COMMENT ON CONSTRAINT certificates_course_id_fkey ON public.certificates IS
  'Intentionally NO ACTION, not CASCADE: certificates are audit/compliance records and must never be silently deleted or orphaned when a course is removed. Deleting a course with existing certificates fails with a FK violation by design; the admin course-delete flow must catch this and require explicit certificate handling first. See CLAUDE.md known-bugs #18.';

COMMENT ON CONSTRAINT certificates_module_id_fkey ON public.certificates IS
  'Intentionally NO ACTION, not CASCADE: same rationale as certificates_course_id_fkey. A module cannot be deleted while a certificate still references it.';

-- 4. certificate_type CHECK (module, course) -- unchanged, still correct. Every row is
--    exactly one type and only the matching *_id column is populated, which is exactly
--    what the partial indexes above assume. No adjustment needed.

-- 5. Idempotent issuance RPC.
--    supabase-js's `.upsert(row, { onConflict: 'user_id,course_id' })` CANNOT target a
--    partial unique index: PostgREST only ever emits `ON CONFLICT (col_list)` with no
--    WHERE clause from the onConflict option, and Postgres requires the ON CONFLICT
--    arbiter's predicate to exactly match an existing index. Since the only unique
--    index on (user_id, course_id) here is partial, a bare
--    `ON CONFLICT (user_id, course_id)` from supabase-js fails at runtime (42P10:
--    "there is no unique or exclusion constraint matching the ON CONFLICT
--    specification"). Raw SQL CAN express the partial predicate, so the fix is a
--    Postgres function called via supabase.rpc(), not supabase-js's upsert().
CREATE OR REPLACE FUNCTION public.issue_certificate(
  p_user_id UUID,
  p_course_id UUID,
  p_module_id UUID,
  p_certificate_type TEXT,
  p_certificate_number TEXT
)
RETURNS public.certificates
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cert public.certificates;
BEGIN
  -- SECURITY DEFINER bypasses RLS, so the ownership/role check that RLS would
  -- normally provide is done here instead (defense-in-depth still lives in the
  -- calling server action, which must also verify the user actually earned this
  -- certificate before calling this function).
  IF auth.uid() IS DISTINCT FROM p_user_id
     AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Not authorized to issue a certificate for another user';
  END IF;

  IF p_certificate_type = 'course' THEN
    IF p_course_id IS NULL THEN
      RAISE EXCEPTION 'course_id is required for certificate_type = course';
    END IF;
    INSERT INTO public.certificates (user_id, course_id, certificate_type, certificate_number)
    VALUES (p_user_id, p_course_id, p_certificate_type, p_certificate_number)
    ON CONFLICT (user_id, course_id) WHERE course_id IS NOT NULL DO NOTHING
    RETURNING * INTO v_cert;

    IF v_cert.id IS NULL THEN
      SELECT * INTO v_cert FROM public.certificates
      WHERE user_id = p_user_id AND course_id = p_course_id;
    END IF;

  ELSIF p_certificate_type = 'module' THEN
    IF p_module_id IS NULL THEN
      RAISE EXCEPTION 'module_id is required for certificate_type = module';
    END IF;
    INSERT INTO public.certificates (user_id, module_id, certificate_type, certificate_number)
    VALUES (p_user_id, p_module_id, p_certificate_type, p_certificate_number)
    ON CONFLICT (user_id, module_id) WHERE module_id IS NOT NULL DO NOTHING
    RETURNING * INTO v_cert;

    IF v_cert.id IS NULL THEN
      SELECT * INTO v_cert FROM public.certificates
      WHERE user_id = p_user_id AND module_id = p_module_id;
    END IF;

  ELSE
    RAISE EXCEPTION 'Invalid certificate_type: %', p_certificate_type;
  END IF;

  RETURN v_cert;
END;
$$;

-- Explicit grant/revoke: SECURITY DEFINER functions default to PUBLIC EXECUTE unless
-- revoked. Restrict to authenticated app users; anon calls are also blocked in-body
-- (auth.uid() is null, which never matches a real p_user_id), but revoke as
-- defense-in-depth to match the ensureAdmin()-style "check in the action AND at the
-- privilege boundary" convention.
REVOKE ALL ON FUNCTION public.issue_certificate(UUID, UUID, UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.issue_certificate(UUID, UUID, UUID, TEXT, TEXT) TO authenticated;

-- 6. Lock down direct certificate inserts.
--    The original "System inserts certificates" policy (WITH CHECK (true), from
--    001_initial_schema.sql) let any authenticated user INSERT an arbitrary row into
--    certificates directly via PostgREST -- completely bypassing the ownership check
--    in issueCertificate() and the idempotency guarantee of issue_certificate() above.
--    Now that certificate issuance goes exclusively through issue_certificate() (a
--    SECURITY DEFINER function that runs as its bypassrls owner and is therefore
--    unaffected by this policy, as is the service-role admin client), direct client
--    inserts serve no legitimate purpose and must be closed.
DROP POLICY IF EXISTS "System inserts certificates" ON public.certificates;

CREATE POLICY "Certificates inserted only via issue_certificate()" ON public.certificates
  FOR INSERT
  WITH CHECK (false);
