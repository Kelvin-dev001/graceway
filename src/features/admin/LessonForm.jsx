'use client';

import { useState } from 'react';
import { createLesson, updateLesson } from '@/actions/lessons';
import { slugify } from '@/lib/utils';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function LessonForm({ lesson, modules = [], sections = [], onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const formData = new FormData(e.target);

    const result = lesson
      ? await updateLesson(lesson.id, formData)
      : await createLesson(formData);

    if (result?.error) {
      setError(result.error);
    } else {
      onSuccess?.(result.data);
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Module</label>
          <select name="module_id" defaultValue={lesson?.module_id} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-navy-500">
            <option value="">Select Module</option>
            {modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Section</label>
          <select name="section_id" defaultValue={lesson?.section_id} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-navy-500">
            <option value="">Select Section</option>
            {sections.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
        </div>
      </div>

      <Input name="title" label="Lesson Title" defaultValue={lesson?.title} required />
      <Input name="slug" label="Slug" defaultValue={lesson?.slug} required />
      <Input name="video_url" label="YouTube Video URL" defaultValue={lesson?.video_url} type="url" placeholder="https://youtube.com/..." />
      <Input name="pdf_url" label="PDF URL" defaultValue={lesson?.pdf_url} type="url" placeholder="https://..." />
      <Input name="duration_minutes" label="Duration (minutes)" defaultValue={lesson?.duration_minutes} type="number" min="0" />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">Content</label>
        <textarea
          name="content"
          defaultValue={lesson?.content}
          placeholder="Lesson content..."
          rows={6}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-navy-500 resize-none"
        />
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" name="is_published" value="true" defaultChecked={lesson?.is_published} className="w-4 h-4 rounded" id="lesson_published" />
        <label htmlFor="lesson_published" className="text-sm font-medium text-gray-700">Published</label>
      </div>

      <Button type="submit" loading={loading} className="w-full">
        {lesson ? 'Update Lesson' : 'Create Lesson'}
      </Button>
    </form>
  );
}
