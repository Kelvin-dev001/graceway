'use client';

import { useRouter } from 'next/navigation';
import CourseForm from '@/features/admin/CourseForm';

export default function NewCoursePage() {
  const router = useRouter();
  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-extrabold text-navy-500 mb-8">New Course</h1>
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <CourseForm onSuccess={() => router.push('/admin/courses')} />
      </div>
    </div>
  );
}
