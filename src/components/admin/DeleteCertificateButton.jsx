'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteCertificate } from '@/actions/admin';

export default function DeleteCertificateButton({ certificateId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleDelete() {
    if (!confirm('Delete this certificate record?')) return;
    setLoading(true);
    setError('');
    const result = await deleteCertificate(certificateId);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    router.refresh();
  }

  return (
    <div className="inline-flex flex-col">
      <button
        type="button"
        disabled={loading}
        onClick={handleDelete}
        className="text-red-500 text-xs font-medium hover:underline disabled:opacity-50"
      >
        {loading ? 'Deleting...' : 'Delete'}
      </button>
      {error && <span className="text-[10px] text-red-500 mt-1">Delete failed.</span>}
    </div>
  );
}
