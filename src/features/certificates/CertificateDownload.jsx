'use client';

import { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import CertificateTemplate from './CertificateTemplate';
import Button from '@/components/ui/Button';

export default function CertificateDownload({ certificate }) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const blob = await pdf(<CertificateTemplate certificate={certificate} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `graceway-certificate-${certificate.certificate_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
    }
    setLoading(false);
  }

  return (
    <Button onClick={handleDownload} loading={loading} variant="success">
      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Download PDF
    </Button>
  );
}
