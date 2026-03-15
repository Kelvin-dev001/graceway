export const dynamic = 'force-dynamic';

import { getAllUsers } from '@/actions/admin';
import UserManagement from '@/features/admin/UserManagement';

export const metadata = { title: 'Users — Graceway Admin' };

export default async function AdminUsersPage() {
  const { data: users } = await getAllUsers();
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-navy-500 mb-1">Users</h1>
        <p className="text-gray-500">Manage all platform users and roles</p>
      </div>
      <UserManagement users={users || []} />
    </div>
  );
}
