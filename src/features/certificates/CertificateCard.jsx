'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { formatDateShort } from '@/lib/utils';
import ShareButton from '@/components/shared/ShareButton';

export default function CertificateCard({ certificate }) {
  const title = certificate.courses?.title || certificate.modules?.title || 'Certificate';
  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/certificates/${certificate.id}`;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-gradient-to-br from-navy-500 to-teal-500 rounded-2xl p-6 text-white shadow-lg"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="text-3xl">📜</div>
        <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">
          {certificate.certificate_type === 'course' ? 'Course' : 'Module'}
        </span>
      </div>
      <h3 className="font-bold text-lg mb-1 line-clamp-2">{title}</h3>
      <p className="text-navy-200 text-sm mb-4">
        Issued {formatDateShort(certificate.issued_at)}
      </p>
      <p className="text-xs text-navy-200 font-mono mb-4">#{certificate.certificate_number}</p>

      <div className="flex gap-2">
        <Link
          href={`/certificates/${certificate.id}`}
          className="flex-1 text-center bg-white text-navy-500 py-2 rounded-xl text-sm font-bold hover:bg-gray-100 transition-colors"
        >
          View
        </Link>
        <ShareButton url={shareUrl} title={`I earned a ${title} certificate on Graceway!`} label="Share" />
      </div>
    </motion.div>
  );
}
