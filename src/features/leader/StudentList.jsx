'use client';

import { formatDateShort } from '@/lib/utils';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';

export default function StudentList({ students = [] }) {
  if (!students.length) {
    return (
      <div className="text-center py-12 text-gray-400">
        <div className="text-4xl mb-3">👥</div>
        <p>No students yet. Share your referral link to get started.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Student</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Role</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Generation</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Joined</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {students.map((student) => (
            <tr key={student.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Avatar src={student.profile_photo} name={student.name} size="sm" />
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{student.name}</p>
                    <p className="text-xs text-gray-400">{student.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <Badge variant={student.role === 'leader' ? 'orange' : 'default'}>{student.role}</Badge>
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">Gen {student.generation_level}</td>
              <td className="px-4 py-3 text-sm text-gray-400">{formatDateShort(student.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
