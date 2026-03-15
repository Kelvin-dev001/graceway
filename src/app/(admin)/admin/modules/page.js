'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { createModule } from '@/actions/admin';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

export default function AdminModulesPage() {
  const [modules, setModules] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.from('modules').select('*, courses(title)').order('order_index').then(({ data }) => setModules(data || []));
    supabase.from('courses').select('id, title').order('order_index').then(({ data }) => setCourses(data || []));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const result = await createModule(formData);
    if (!result?.error) {
      e.target.reset();
      const { data } = await supabase.from('modules').select('*, courses(title)').order('order_index');
      setModules(data || []);
    }
    setLoading(false);
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-navy-500 mb-1">Modules</h1>
        <p className="text-gray-500">Manage course modules</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="font-bold text-navy-500 mb-4">Add Module</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Course</label>
              <select name="course_id" required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-navy-500">
                <option value="">Select Course</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <Input name="title" label="Module Title" required />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Description</label>
              <textarea name="description" rows={2} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-navy-500 resize-none" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" name="is_published" value="true" id="mod_published" className="w-4 h-4" />
              <label htmlFor="mod_published" className="text-sm font-medium text-gray-700">Published</label>
            </div>
            <Button type="submit" loading={loading}>Create Module</Button>
          </form>
        </div>

        <div>
          <h2 className="font-bold text-navy-500 mb-4">All Modules ({modules.length})</h2>
          <div className="flex flex-col gap-2">
            {modules.map(m => (
              <div key={m.id} className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800 text-sm">{m.title}</p>
                  <p className="text-xs text-gray-400">{m.courses?.title}</p>
                </div>
                <Badge variant={m.is_published ? 'success' : 'default'}>{m.is_published ? 'Live' : 'Draft'}</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
