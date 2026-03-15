export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { formatDate } from '@/lib/utils';
import CertificateDownload from '@/features/certificates/CertificateDownload';
import ShareButton from '@/components/shared/ShareButton';

export default async function CertificateDetailPage({ params }) {
  const supabase = createClient();

  const { data: certificate } = await supabase
    .from('certificates')
    .select('*, profiles(*), courses(*), modules(*)')
    .eq('id', params.certId)
    .single();

  if (!certificate) redirect('/certificates');

  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/certificates/${certificate.id}`;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-gradient-to-br from-navy-500 to-teal-500 rounded-3xl p-8 text-white text-center mb-8 shadow-2xl">
        <div className="text-6xl mb-4">🎓</div>
        <p className="text-navy-200 text-sm mb-2">Certificate of Completion</p>
        <h1 className="text-2xl font-extrabold mb-2">
          {certificate.courses?.title || certificate.modules?.title}
        </h1>
        <p className="text-navy-100 text-lg">Awarded to</p>
        <p className="text-3xl font-extrabold text-orange-300 my-2">{certificate.profiles?.name}</p>
        <p className="text-navy-200 text-sm">Issued {formatDate(certificate.issued_at)}</p>
        <p className="text-navy-300 text-xs mt-2 font-mono">#{certificate.certificate_number}</p>
      </div>

      <div className="flex gap-3 justify-center">
        <CertificateDownload certificate={certificate} />
        <ShareButton url={shareUrl} title={`I earned a certificate on Graceway!`} label="Share" />
      </div>
    </div>
  );
}
