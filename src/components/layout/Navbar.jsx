'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from '@/actions/auth';
import Avatar from '@/components/ui/Avatar';
import { useState } from 'react';

export default function Navbar() {
  const { user, profile, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  async function handleSignOut() {
    const role = profile?.role;
    const result = await signOut();
    if (!result?.error) {
      router.push(role === 'admin' ? '/login' : '/');
      router.refresh();
    }
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Graceway logo" width={32} height={32} className="h-8 w-8 object-contain" />
            <span className="font-bold text-navy-500 text-lg hidden sm:block">Graceway</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {!loading && user ? (
              <>
                <Link href="/dashboard" className="text-gray-600 hover:text-navy-500 font-medium transition-colors">Dashboard</Link>
                <Link href="/courses" className="text-gray-600 hover:text-navy-500 font-medium transition-colors">Courses</Link>
                {(profile?.role === 'leader' || profile?.role === 'admin') && (
                  <Link href="/leader" className="text-gray-600 hover:text-navy-500 font-medium transition-colors">Leader</Link>
                )}
                {profile?.role === 'admin' && (
                  <Link href="/admin" className="text-gray-600 hover:text-navy-500 font-medium transition-colors">Admin</Link>
                )}
                <div className="flex items-center gap-3">
                  <Link href="/profile">
                    <Avatar src={profile?.profile_photo} name={profile?.name} size="sm" />
                  </Link>
                  <button type="button" onClick={handleSignOut} className="text-sm text-gray-500 hover:text-red-500 transition-colors">Sign Out</button>
                </div>
              </>
            ) : (
              <Link href="/login" className="text-gray-600 hover:text-navy-500 font-medium transition-colors">Sign In</Link>
            )}
          </div>

          <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
            <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>
        </div>

        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden pb-4 flex flex-col gap-3 border-t border-gray-100 pt-3"
          >
            {user ? (
              <>
                <Link href="/dashboard" className="text-gray-600 hover:text-navy-500 font-medium px-2 py-1">Dashboard</Link>
                <Link href="/courses" className="text-gray-600 hover:text-navy-500 font-medium px-2 py-1">Courses</Link>
                <Link href="/profile" className="text-gray-600 hover:text-navy-500 font-medium px-2 py-1">Profile</Link>
                <button type="button" onClick={handleSignOut} className="text-red-500 font-medium px-2 py-1 text-left">Sign Out</button>
              </>
            ) : (
              <Link href="/login" className="text-gray-600 font-medium px-2 py-1">Sign In</Link>
            )}
          </motion.div>
        )}
      </div>
    </nav>
  );
}
