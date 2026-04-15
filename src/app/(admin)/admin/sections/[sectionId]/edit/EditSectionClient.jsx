'use client';

import { useRouter } from 'next/navigation';
import SectionForm from '@/features/admin/SectionForm';

export default function EditSectionClient({ section, modules = [] }) {
  const router = useRouter();

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-extrabold text-navy-500 mb-8">Edit Section</h1>
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <SectionForm section={section} modules={modules} onSuccess={() => router.push('/admin/sections')} />
      </div>
    </div>
  );
}
