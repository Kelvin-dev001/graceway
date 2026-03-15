'use client';

import { useState } from 'react';
import { getReferralUrl } from '@/lib/utils';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function InviteForm({ referralCode }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const referralUrl = getReferralUrl(referralCode);

  async function handleSubmit(e) {
    e.preventDefault();
    const subject = encodeURIComponent('Join me on Graceway Generation!');
    const body = encodeURIComponent(
      `Hi!\n\nI want to invite you to join Graceway Generation — a digital discipleship platform for believers to grow spiritually.\n\nClick this link to join using my referral:\n${referralUrl}\n\nSee you there!`
    );
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
    setSent(true);
    setTimeout(() => setSent(false), 3000);
    setEmail('');
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        type="email"
        placeholder="friend@example.com"
        required
        className="flex-1"
      />
      <Button type="submit" variant="primary">
        {sent ? '✓ Sent!' : 'Invite'}
      </Button>
    </form>
  );
}
