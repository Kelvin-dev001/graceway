'use client';

import { formatDateShort } from '@/lib/utils';

export default function ReferralStats({ stats }) {
  if (!stats) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center shadow-sm">
          <div className="text-3xl font-extrabold text-navy-500">{stats.totalReferrals}</div>
          <div className="text-sm text-gray-500 mt-1">Total Referrals</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center shadow-sm">
          <div className="text-3xl font-extrabold text-green-500">
            {stats.referrals?.filter(r => r.role !== 'student').length || 0}
          </div>
          <div className="text-sm text-gray-500 mt-1">Active Leaders</div>
        </div>
      </div>

      {stats.referrals && stats.referrals.length > 0 && (
        <div>
          <h3 className="font-bold text-navy-500 mb-3">Your Referrals</h3>
          <div className="flex flex-col gap-2">
            {stats.referrals.map((r) => (
              <div key={r.id} className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-3">
                <div>
                  <p className="font-medium text-gray-800">{r.name}</p>
                  <p className="text-xs text-gray-400">{r.email}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded-full ${r.role === 'leader' ? 'bg-orange-100 text-orange-700' : 'bg-navy-50 text-navy-600'}`}>
                    {r.role}
                  </span>
                  <p className="text-xs text-gray-400 mt-1">{formatDateShort(r.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
