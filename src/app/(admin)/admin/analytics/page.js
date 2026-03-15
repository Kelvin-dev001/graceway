export const dynamic = 'force-dynamic';

import { getAdminStats } from '@/actions/admin';
import AnalyticsDashboard from '@/features/admin/AnalyticsDashboard';

export const metadata = { title: 'Analytics — Graceway Admin' };

export default async function AdminAnalyticsPage() {
  const { data: stats } = await getAdminStats();
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-navy-500 mb-1">Analytics</h1>
        <p className="text-gray-500">Platform statistics and insights</p>
      </div>
      <AnalyticsDashboard stats={stats} />
    </div>
  );
}
