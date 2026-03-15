'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import CourseForm from '@/features/admin/CourseForm';

export default function EditCoursePage({ params }) {
  const router = useRouter();
  const [course, setCourse] = useState(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.from('courses').select('*').eq('id', params.courseId).single().then(({ data }) => setCourse(data));
  }, [params.courseId]);

  if (!course) return <div className="text-center py-12 text-gray-400">Loading...</div>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-extrabold text-navy-500 mb-8">Edit Course</h1>
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <CourseForm course={course} onSuccess={() => router.push('/admin/courses')} />
      </div>
    </div>
  );
}
