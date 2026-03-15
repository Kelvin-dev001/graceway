'use client';

import { useState } from 'react';
import { getReferralUrl } from '@/lib/utils';

export default function ReferralLink({ code }) {
  const [copied, setCopied] = useState(false);
  const url = getReferralUrl(code);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Copy failed:', e);
    }
  }

  return (
    <div className="bg-navy-50 border border-navy-200 rounded-2xl p-5">
      <h3 className="font-bold text-navy-500 mb-1">Your Referral Link</h3>
      <p className="text-sm text-gray-500 mb-4">Share this link to invite others to your discipleship network</p>
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono text-gray-700 truncate">
          {url}
        </div>
        <button
          onClick={handleCopy}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors flex-shrink-0 ${
            copied ? 'bg-green-500 text-white' : 'bg-navy-500 text-white hover:bg-navy-600'
          }`}
        >
          {copied ? '✓ Copied!' : 'Copy'}
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-3">Code: <strong>{code}</strong></p>
    </div>
  );
}
