'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { updateProfile } from '@/actions/auth';
import { createClient } from '@/lib/supabase/client';
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
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [treeData, setTreeData] = useState([]);
  const [treeLoading, setTreeLoading] = useState(false);
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);
  const activeTab = searchParams.get('tab') || 'overview';

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

  useEffect(() => {
    async function loadStudents() {
      if (!profile?.referral_code || activeTab !== 'students') return;
      setStudentsLoading(true);
      const { data } = await supabase
        .from('profiles')
        .select('id, name, email, created_at')
        .eq('referred_by', profile.referral_code)
        .order('created_at', { ascending: false });
      setStudents(data || []);
      setStudentsLoading(false);
    }
    loadStudents();
  }, [activeTab, profile?.referral_code, supabase]);

  useEffect(() => {
    async function loadTree() {
      if (!profile?.referral_code || activeTab !== 'tree') return;
      setTreeLoading(true);
      const { data } = await supabase
        .from('profiles')
        .select('id, name, email, referral_code, referred_by');

      if (!data?.length) {
        setTreeData([]);
        setTreeLoading(false);
        return;
      }

      const byReferral = data.reduce((acc, item) => {
        if (item.referred_by) {
          if (!acc[item.referred_by]) acc[item.referred_by] = [];
          acc[item.referred_by].push(item);
        }
        return acc;
      }, {});

      const rows = [];
      function walk(node, depth = 0) {
        rows.push({ ...node, depth });
        const children = byReferral[node.referral_code] || [];
        children.forEach((child) => walk(child, depth + 1));
      }

      const root = data.find((item) => item.id === user?.id);
      if (root) walk(root);
      setTreeData(rows);
      setTreeLoading(false);
    }
    loadTree();
  }, [activeTab, profile?.referral_code, supabase, user?.id]);

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
            {profile?.role !== 'admin' && (
              <div className="flex gap-2 mt-2">
                <Badge variant={profile?.role === 'leader' ? 'orange' : 'default'}>
                  {profile?.role}
                </Badge>
                <Badge variant="teal">Gen {profile?.generation_level}</Badge>
              </div>
            )}
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

        {profile?.role === 'admin' ? (
          <div className="text-sm text-gray-600">
            <p><span className="font-medium">Name:</span> {profile?.name}</p>
            <p className="mt-2"><span className="font-medium">Email:</span> {profile?.email}</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-5">
              <Link href="/profile?tab=overview" className={`px-3 py-1.5 rounded-lg text-sm font-medium ${activeTab === 'overview' ? 'bg-navy-500 text-white' : 'bg-gray-100 text-gray-600'}`}>Overview</Link>
              <Link href="/profile?tab=students" className={`px-3 py-1.5 rounded-lg text-sm font-medium ${activeTab === 'students' ? 'bg-navy-500 text-white' : 'bg-gray-100 text-gray-600'}`}>Students</Link>
              <Link href="/profile?tab=tree" className={`px-3 py-1.5 rounded-lg text-sm font-medium ${activeTab === 'tree' ? 'bg-navy-500 text-white' : 'bg-gray-100 text-gray-600'}`}>Tree</Link>
            </div>

            {activeTab === 'overview' && (
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
            )}

            {activeTab === 'students' && (
              <div className="space-y-3">
                {studentsLoading ? (
                  <p className="text-sm text-gray-500">Loading students...</p>
                ) : students.length ? (
                  students.map((student) => (
                    <div key={student.id} className="border border-gray-100 rounded-xl p-3">
                      <p className="font-medium text-gray-800">{student.name}</p>
                      <p className="text-sm text-gray-500">{student.email}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No referred students yet.</p>
                )}
              </div>
            )}

            {activeTab === 'tree' && (
              <div className="space-y-2">
                {treeLoading ? (
                  <p className="text-sm text-gray-500">Loading tree...</p>
                ) : treeData.length ? (
                  treeData.map((node) => (
                    <div
                      key={node.id}
                      className={`text-sm text-gray-700 ${
                        node.depth === 0 ? 'pl-0' : node.depth === 1 ? 'pl-4' : node.depth === 2 ? 'pl-8' : 'pl-12'
                      }`}
                    >
                      {node.depth > 0 ? '└─ ' : ''}{node.name || node.email}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No tree data available yet.</p>
                )}
              </div>
            )}
          </>
        )}
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
