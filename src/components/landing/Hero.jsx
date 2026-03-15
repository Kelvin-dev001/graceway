'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-500 via-navy-600 to-teal-500 overflow-hidden pt-16">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-400 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-500 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="inline-block bg-orange-500 text-white text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
            Digital Discipleship Platform
          </span>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-tight mb-6">
            Grow. Learn.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-300">
              Multiply.
            </span>
          </h1>

          <p className="text-xl text-navy-100 max-w-2xl mx-auto mb-10 leading-relaxed">
            Join Graceway Generation and walk the discipleship growth loop: 
            <strong className="text-white"> Recruit → Root → Certify → Multiply → Lead → Repeat</strong>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/signup"
                className="inline-block bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-2xl text-lg font-bold transition-colors shadow-lg"
              >
                Start Your Journey →
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/login"
                className="inline-block bg-white/10 hover:bg-white/20 text-white border border-white/30 px-8 py-4 rounded-2xl text-lg font-bold transition-colors backdrop-blur-sm"
              >
                Sign In
              </Link>
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-16 grid grid-cols-3 gap-8 text-center"
        >
          {[
            { value: '100+', label: 'Lessons' },
            { value: '∞', label: 'Generations' },
            { value: '🎓', label: 'Certificates' },
          ].map((stat) => (
            <div key={stat.label} className="text-white">
              <div className="text-3xl font-bold">{stat.value}</div>
              <div className="text-navy-200 text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
