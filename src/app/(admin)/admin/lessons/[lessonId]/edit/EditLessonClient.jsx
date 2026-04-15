'use client';

import { useRouter } from 'next/navigation';
import LessonForm from '@/features/admin/LessonForm';

export default function EditLessonClient({ lesson, modules = [], sections = [] }) {
  const router = useRouter();

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-extrabold text-navy-500 mb-8">Edit Lesson</h1>
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <LessonForm lesson={lesson} modules={modules} sections={sections} onSuccess={() => router.push('/admin/lessons')} />
      </div>
    </div>
  );
}
