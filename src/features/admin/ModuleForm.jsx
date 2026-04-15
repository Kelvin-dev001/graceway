'use client';

import { useState } from 'react';
import { createModule, updateModule } from '@/actions/admin';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function ModuleForm({ module, courses = [], onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const formData = new FormData(e.target);
    const result = module ? await updateModule(module.id, formData) : await createModule(formData);
    if (result?.error) {
      setError(result.error);
    } else {
      if (!module) e.target.reset();
      onSuccess?.(result.data);
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
      )}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">Course</label>
        <select name="course_id" defaultValue={module?.course_id} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-navy-500">
          <option value="">Select Course</option>
          {courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
        </select>
      </div>
      <Input name="title" label="Module Title" defaultValue={module?.title} required />
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">Description</label>
        <textarea
          name="description"
          defaultValue={module?.description}
          rows={2}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-navy-500 resize-none"
        />
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" name="is_published" value="true" defaultChecked={module?.is_published} id="mod_published" className="w-4 h-4" />
        <label htmlFor="mod_published" className="text-sm font-medium text-gray-700">Published</label>
      </div>
      <Button type="submit" loading={loading}>{module ? 'Update Module' : 'Create Module'}</Button>
    </form>
  );
}
