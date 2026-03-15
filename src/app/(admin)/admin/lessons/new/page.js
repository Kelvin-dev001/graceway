'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import LessonForm from '@/features/admin/LessonForm';

export default function NewLessonPage() {
  const router = useRouter();
  const [modules, setModules] = useState([]);
  const [sections, setSections] = useState([]);
  const supabase = createClient();

  useEffect(() => {
    supabase.from('modules').select('id, title').then(({ data }) => setModules(data || []));
    supabase.from('sections').select('id, title, module_id').then(({ data }) => setSections(data || []));
  }, []);

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-extrabold text-navy-500 mb-8">New Lesson</h1>
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <LessonForm modules={modules} sections={sections} onSuccess={() => router.push('/admin/lessons')} />
      </div>
    </div>
  );
}
