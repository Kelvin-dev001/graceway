'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';

export default function ShareButton({ url, title = 'Check this out!', label = 'Share' }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (e) {
      console.error('Share failed:', e);
    }
  };

  return (
    <Button variant="outline" onClick={handleShare} size="sm">
      {copied ? '✓ Copied!' : label}
    </Button>
  );
}
