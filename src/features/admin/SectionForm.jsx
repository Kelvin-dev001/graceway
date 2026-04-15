'use client';

import { useState } from 'react';
import { createSection, updateSection } from '@/actions/admin';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function SectionForm({ section, modules = [], onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const formData = new FormData(e.target);
    const result = section ? await updateSection(section.id, formData) : await createSection(formData);
    if (result?.error) {
      setError(result.error);
    } else {
      if (!section) e.target.reset();
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
        <label className="text-sm font-medium text-gray-700 mb-1 block">Module</label>
        <select name="module_id" defaultValue={section?.module_id} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-navy-500">
          <option value="">Select Module</option>
          {modules.map((module) => <option key={module.id} value={module.id}>{module.title}</option>)}
        </select>
      </div>
      <Input name="title" label="Section Title" defaultValue={section?.title} required />
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">Description</label>
        <textarea
          name="description"
          defaultValue={section?.description}
          rows={2}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-navy-500 resize-none"
        />
      </div>
      <Button type="submit" loading={loading}>{section ? 'Update Section' : 'Create Section'}</Button>
    </form>
  );
}
