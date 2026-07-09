export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { formatDate } from '@/lib/utils';
import CertificateDownload from '@/features/certificates/CertificateDownload';
import ShareButton from '@/components/shared/ShareButton';

export default async function CertificateDetailPage({ params }) {
  const { certId } = await params;
  const supabase = await createClient();

  const { data: cert } = await supabase
    .rpc('get_public_certificate', { p_certificate_id: certId })
    .maybeSingle();

  if (!cert) redirect('/certificates');

  const certificate = {
    id: cert.id,
    certificate_number: cert.certificate_number,
    issued_at: cert.issued_at,
    pdf_url: cert.pdf_url,
    profiles: { name: cert.recipient_name },
    courses: cert.course_title ? { title: cert.course_title } : null,
    modules: cert.module_title ? { title: cert.module_title } : null,
  };

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
