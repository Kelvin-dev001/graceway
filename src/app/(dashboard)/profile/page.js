'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { updateProfile } from '@/actions/auth';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import { getReferralUrl } from '@/lib/utils';

export default function ProfilePage() {
  const { user, profile, loading } = useAuth();
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const formData = new FormData(e.target);
    const result = await updateProfile(formData);
    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    }
    setSaving(false);
  }

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>;

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-navy-500 mb-2">My Profile</h1>
        <p className="text-gray-500">Manage your account settings</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-6">
        <div className="flex items-center gap-4 mb-6">
          <Avatar src={profile?.profile_photo} name={profile?.name} size="xl" />
          <div>
            <h2 className="text-xl font-bold text-navy-500">{profile?.name}</h2>
            <p className="text-gray-500">{profile?.email}</p>
            <div className="flex gap-2 mt-2">
              <Badge variant={profile?.role === 'admin' ? 'danger' : profile?.role === 'leader' ? 'orange' : 'default'}>
                {profile?.role}
              </Badge>
              <Badge variant="teal">Gen {profile?.generation_level}</Badge>
            </div>
          </div>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-4 text-sm">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input name="name" label="Full Name" defaultValue={profile?.name} required />
          <Input name="phone" label="Phone" defaultValue={profile?.phone} type="tel" />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Bio</label>
            <textarea
              name="bio"
              defaultValue={profile?.bio}
              placeholder="Tell us about yourself..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-navy-500 resize-none"
            />
          </div>
          <Button type="submit" loading={saving}>Save Changes</Button>
        </form>
      </div>

      {profile?.referral_code && (
        <div className="bg-navy-50 border border-navy-200 rounded-2xl p-5">
          <h3 className="font-bold text-navy-500 mb-1">Your Referral Code</h3>
          <p className="text-2xl font-bold text-orange-500 font-mono">{profile.referral_code}</p>
          <p className="text-sm text-gray-500 mt-2">Referral URL: {getReferralUrl(profile.referral_code)}</p>
        </div>
      )}
    </div>
  );
}
