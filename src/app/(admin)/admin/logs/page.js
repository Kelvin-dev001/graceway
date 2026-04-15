export const dynamic = 'force-dynamic';

export const metadata = { title: 'Logs — Graceway Admin' };

export default function AdminLogsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-navy-500 mb-1">Logs</h1>
        <p className="text-gray-500">System activity and audit logs.</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-6 text-gray-500">
        Logs view is ready. Connect your logging provider to populate entries.
      </div>
    </div>
  );
}
