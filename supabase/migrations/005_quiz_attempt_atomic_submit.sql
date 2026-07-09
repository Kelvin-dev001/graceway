-- 005_quiz_attempt_atomic_submit.sql
-- Purpose: close the count-then-insert race in submitQuizAttempt (CLAUDE.md bug #8)
-- by moving the check+insert into a single Postgres function serialized with an
-- advisory transaction lock, and lock down direct client inserts/updates now that
-- this function is the only sanctioned insert path (same pattern as
-- issue_certificate() in 003_certificate_constraints.sql).

-- 1. Missing index: every count-check and lookup on quiz_attempts filters by
--    (quiz_id, user_id); only the PK existed before this.
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_user
  ON public.quiz_attempts(quiz_id, user_id);

-- 2. Atomic "check attempt count under lock, then insert" function.
--    Locking strategy: SELECT ... FOR UPDATE only locks EXISTING rows, so two
--    transactions racing to submit the Nth (final) attempt would both see
--    count < max_attempts and both pass -- there is no row yet to lock that
--    would block the phantom insert (classic phantom-read gap, not solved by
--    row-level locking). max_attempts is admin-configurable (not always 1), so
--    a plain UNIQUE constraint doesn't fit the way it did for certificates.
--    The correct primitive is a session/transaction advisory lock keyed on the
--    (quiz_id, user_id) pair: pg_advisory_xact_lock serializes ALL concurrent
--    calls for that exact pair, regardless of whether any row exists yet, and
--    releases automatically at COMMIT/ROLLBACK. Locking table-wide would also
--    work but is far coarser -- it would serialize every quiz submission across
--    all users and quizzes simultaneously, a real problem at 200-user /
--    spiky-concurrency scale. The advisory lock's blast radius is exactly one
--    (quiz, user) pair.
CREATE OR REPLACE FUNCTION public.submit_quiz_attempt(
  p_user_id UUID,
  p_quiz_id UUID,
  p_score INTEGER,
  p_total_points INTEGER,
  p_percentage NUMERIC,
  p_passed BOOLEAN,
  p_answers JSONB,
  p_started_at TIMESTAMPTZ
)
RETURNS public.quiz_attempts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max_attempts INTEGER;
  v_attempt_count INTEGER;
  v_attempt public.quiz_attempts;
BEGIN
  -- SECURITY DEFINER bypasses RLS, so the ownership check RLS would normally
  -- provide is done here instead -- same pattern as issue_certificate(). This
  -- function only handles the atomic count-check+insert; eligibility
  -- (enrollment, is_published) stays in the calling server action as simple
  -- non-racy read-only gates, same split as issue_certificate() leaving
  -- "did they earn this" to its caller.
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Not authorized to submit a quiz attempt for another user';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(p_quiz_id::text), hashtext(p_user_id::text));

  SELECT max_attempts INTO v_max_attempts
  FROM public.quizzes
  WHERE id = p_quiz_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'QUIZ_NOT_FOUND';
  END IF;

  SELECT COUNT(*) INTO v_attempt_count
  FROM public.quiz_attempts
  WHERE quiz_id = p_quiz_id AND user_id = p_user_id;

  IF v_attempt_count >= COALESCE(v_max_attempts, 3) THEN
    RAISE EXCEPTION 'MAX_ATTEMPTS_REACHED';
  END IF;

  INSERT INTO public.quiz_attempts (
    quiz_id, user_id, score, total_points, percentage, passed, answers,
    started_at, completed_at
  ) VALUES (
    p_quiz_id, p_user_id, p_score, p_total_points, p_percentage, p_passed,
    p_answers, p_started_at, NOW()
  )
  RETURNING * INTO v_attempt;

  RETURN v_attempt;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_quiz_attempt(
  UUID, UUID, INTEGER, INTEGER, NUMERIC, BOOLEAN, JSONB, TIMESTAMPTZ
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_quiz_attempt(
  UUID, UUID, INTEGER, INTEGER, NUMERIC, BOOLEAN, JSONB, TIMESTAMPTZ
) TO authenticated;

-- 3. Lock down direct inserts now that submit_quiz_attempt() is the only
--    sanctioned path -- same reasoning as closing certificates' insert policy
--    in migration 003.
DROP POLICY IF EXISTS "Users create own attempts" ON public.quiz_attempts;

CREATE POLICY "Quiz attempts inserted only via submit_quiz_attempt()" ON public.quiz_attempts
  FOR INSERT
  WITH CHECK (false);

-- 4. Also lock down direct updates. The existing "Users update own attempts"
--    policy (USING (auth.uid() = user_id), no WITH CHECK) lets a student UPDATE
--    their own already-graded row and set passed/score/percentage to anything
--    after the fact -- a pre-existing hole that would make the grading-integrity
--    guarantee this migration adds partially moot if left open. Attempts are
--    immutable once graded; nothing in the app updates a quiz_attempts row after
--    insert, so closing this has no functional impact on any current feature.
DROP POLICY IF EXISTS "Users update own attempts" ON public.quiz_attempts;

CREATE POLICY "Quiz attempts are immutable after grading" ON public.quiz_attempts
  FOR UPDATE
  USING (false);
