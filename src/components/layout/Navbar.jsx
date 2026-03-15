'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from '@/actions/auth';
import Avatar from '@/components/ui/Avatar';
import { useState } from 'react';

export default function Navbar() {
  const { user, profile, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-navy-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">G</span>
            </div>
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
                  <form action={signOut}>
                    <button type="submit" className="text-sm text-gray-500 hover:text-red-500 transition-colors">Sign out</button>
                  </form>
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="text-gray-600 hover:text-navy-500 font-medium transition-colors">Sign In</Link>
                <Link href="/signup" className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-semibold transition-colors">
                  Get Started
                </Link>
              </>
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
                <form action={signOut}>
                  <button type="submit" className="text-red-500 font-medium px-2 py-1">Sign out</button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login" className="text-gray-600 font-medium px-2 py-1">Sign In</Link>
                <Link href="/signup" className="bg-orange-500 text-white px-4 py-2 rounded-xl font-semibold text-center">Get Started</Link>
              </>
            )}
          </motion.div>
        )}
      </div>
    </nav>
  );
}
