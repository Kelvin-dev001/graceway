'use client';

import { useRouter } from 'next/navigation';
import ModuleForm from '@/features/admin/ModuleForm';

export default function NewModuleClient({ courses = [] }) {
  const router = useRouter();

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-extrabold text-navy-500 mb-8">New Module</h1>
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <ModuleForm courses={courses} onSuccess={() => router.push('/admin/modules')} />
      </div>
    </div>
  );
}
