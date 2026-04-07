'use client';

import { useState } from 'react';
import { createSection } from '@/actions/admin';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function SectionForm({ modules = [], initialSections = [] }) {
  const [sections, setSections] = useState(initialSections);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const formData = new FormData(e.target);
    const result = await createSection(formData);
    if (result?.error) {
      setError(result.error);
    } else if (result?.data) {
      const mod = modules.find(m => m.id === result.data.module_id);
      setSections(prev => [...prev, { ...result.data, modules: mod ? { title: mod.title, courses: mod.courses } : null }]);
      e.target.reset();
    }
    setLoading(false);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h2 className="font-bold text-navy-500 mb-4">Add Section</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
          )}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Module</label>
            <select name="module_id" required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-navy-500">
              <option value="">Select Module</option>
              {modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
            </select>
          </div>
          <Input name="title" label="Section Title" required />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea name="description" rows={2} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-navy-500 resize-none" />
          </div>
          <Button type="submit" loading={loading}>Create Section</Button>
        </form>
      </div>

      <div>
        <h2 className="font-bold text-navy-500 mb-4">All Sections ({sections.length})</h2>
        <div className="flex flex-col gap-2">
          {sections.map(s => (
            <div key={s.id} className="bg-white border border-gray-100 rounded-xl px-4 py-3">
              <p className="font-medium text-gray-800 text-sm">{s.title}</p>
              <p className="text-xs text-gray-400">
                {s.modules?.title}{s.modules?.courses?.title ? ` · ${s.modules.courses.title}` : ''}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
