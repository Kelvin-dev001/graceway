'use client';

import { useState } from 'react';
import { createCourse, updateCourse } from '@/actions/courses';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function CourseForm({ course, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const formData = new FormData(e.target);
    
    const result = course
      ? await updateCourse(course.id, formData)
      : await createCourse(formData);

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

      <Input
        name="title"
        label="Course Title"
        defaultValue={course?.title}
        placeholder="e.g., Foundation of Faith"
        required
      />
      <Input
        name="slug"
        label="Slug"
        defaultValue={course?.slug}
        placeholder="e.g., foundation-of-faith"
        required
      />
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">Description</label>
        <textarea
          name="description"
          defaultValue={course?.description}
          placeholder="Course description..."
          rows={3}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-navy-500 resize-none"
        />
      </div>
      <Input
        name="thumbnail"
        label="Thumbnail URL"
        defaultValue={course?.thumbnail}
        placeholder="https://..."
        type="url"
      />
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          name="is_published"
          value="true"
          defaultChecked={course?.is_published}
          className="w-4 h-4 rounded text-navy-500"
          id="is_published"
        />
        <label htmlFor="is_published" className="text-sm font-medium text-gray-700">Published</label>
      </div>

      <Button type="submit" loading={loading} className="w-full">
        {course ? 'Update Course' : 'Create Course'}
      </Button>
    </form>
  );
}
