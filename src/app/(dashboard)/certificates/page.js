export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import CertificateCard from '@/features/certificates/CertificateCard';
import Link from 'next/link';

export const metadata = { title: 'Certificates — Graceway' };

export default async function CertificatesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: certificates } = await supabase
    .from('certificates')
    .select('*, courses(title), modules(title)')
    .eq('user_id', user.id)
    .order('issued_at', { ascending: false });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-navy-500 mb-2">My Certificates</h1>
        <p className="text-gray-500">Your earned certificates of completion</p>
      </div>

      {!certificates?.length ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">📜</div>
          <p className="mb-4">No certificates yet. Complete a course to earn one!</p>
          <Link href="/courses" className="text-navy-500 font-semibold hover:underline">Browse Courses</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((cert) => (
            <CertificateCard key={cert.id} certificate={cert} />
          ))}
        </div>
      )}
    </div>
  );
}
