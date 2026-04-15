export const dynamic = 'force-dynamic';

import { getAllCertificates } from '@/actions/admin';
import { formatDateShort } from '@/lib/utils';
import DeleteCertificateButton from '@/components/admin/DeleteCertificateButton';

export const metadata = { title: 'Certificates — Graceway Admin' };

export default async function AdminCertificatesPage() {
  const { data: certificates } = await getAllCertificates();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-navy-500 mb-1">Certificates</h1>
        <p className="text-gray-500">All issued certificates</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Recipient</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Course/Module</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Issued</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {certificates?.map(cert => (
              <tr key={cert.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-800 text-sm">{cert.profiles?.name}</p>
                  <p className="text-xs text-gray-400">{cert.profiles?.email}</p>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{cert.courses?.title || cert.modules?.title}</td>
                <td className="px-4 py-3 text-sm text-gray-600 capitalize">{cert.certificate_type}</td>
                <td className="px-4 py-3 text-sm text-gray-400">{formatDateShort(cert.issued_at)}</td>
                <td className="px-4 py-3"><DeleteCertificateButton certificateId={cert.id} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
