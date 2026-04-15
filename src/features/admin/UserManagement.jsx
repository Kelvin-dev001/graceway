'use client';

import { useState } from 'react';
import { updateUserRole } from '@/actions/admin';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import DeleteUserButton from '@/components/admin/DeleteUserButton';
import { formatDateShort } from '@/lib/utils';

export default function UserManagement({ users: initialUsers = [] }) {
  const [users, setUsers] = useState(initialUsers);
  const [updating, setUpdating] = useState(null);

  async function handleRoleChange(userId, newRole) {
    setUpdating(userId);
    const result = await updateUserRole(userId, newRole);
    if (!result?.error) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    }
    setUpdating(null);
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">User</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Role</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Generation</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Joined</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Avatar src={user.profile_photo} name={user.name} size="sm" />
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{user.name}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <Badge variant={user.role === 'admin' ? 'danger' : user.role === 'leader' ? 'orange' : 'default'}>
                  {user.role}
                </Badge>
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">Gen {user.generation_level}</td>
              <td className="px-4 py-3 text-sm text-gray-400">{formatDateShort(user.created_at)}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <select
                    value={user.role}
                    disabled={updating === user.id}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-navy-500"
                  >
                    <option value="student">Student</option>
                    <option value="leader">Leader</option>
                    <option value="admin">Admin</option>
                  </select>
                  <DeleteUserButton userId={user.id} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
