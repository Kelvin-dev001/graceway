ALTER TABLE public.quizzes
ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_quizzes_course_id ON public.quizzes(course_id);
