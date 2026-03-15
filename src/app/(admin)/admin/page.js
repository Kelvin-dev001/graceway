export const dynamic = 'force-dynamic';

import { getAdminStats } from '@/actions/admin';
import AnalyticsDashboard from '@/features/admin/AnalyticsDashboard';
import Link from 'next/link';

export const metadata = { title: 'Admin Dashboard — Graceway' };

export default async function AdminPage() {
  const { data: stats } = await getAdminStats();

  const quickLinks = [
    { href: '/admin/courses/new', label: 'New Course', icon: '📚' },
    { href: '/admin/lessons/new', label: 'New Lesson', icon: '📝' },
    { href: '/admin/quizzes/new', label: 'New Quiz', icon: '🧪' },
    { href: '/admin/users', label: 'Manage Users', icon: '👥' },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-extrabold text-navy-500 mb-1">Admin Dashboard</h1>
        <p className="text-gray-500">Manage the Graceway platform</p>
      </div>

      <AnalyticsDashboard stats={stats} />

      <div>
        <h2 className="text-xl font-bold text-navy-500 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {quickLinks.map(link => (
            <Link key={link.href} href={link.href} className="bg-white rounded-2xl border border-gray-100 p-4 text-center hover:shadow-md transition-shadow">
              <div className="text-3xl mb-2">{link.icon}</div>
              <div className="font-medium text-navy-500 text-sm">{link.label}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
