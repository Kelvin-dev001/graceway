'use client';

import { motion } from 'framer-motion';

const testimonials = [
  {
    name: 'Sarah M.',
    role: 'Student',
    text: 'Graceway changed my spiritual journey. The structured lessons helped me go deeper in faith.',
    avatar: 'SM',
  },
  {
    name: 'David K.',
    role: 'Leader, Gen 1',
    text: 'I have 23 disciples in my tree now. The platform makes it easy to track and guide everyone.',
    avatar: 'DK',
  },
  {
    name: 'Grace T.',
    role: 'Student',
    text: 'Earning my first certificate was such a milestone. I love how the courses are structured.',
    avatar: 'GT',
  },
];

export default function Testimonials() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-navy-500 mb-4">Stories of Growth</h2>
          <p className="text-xl text-gray-600">See how Graceway is transforming lives.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="bg-gray-50 rounded-2xl p-6 border border-gray-100"
            >
              <p className="text-gray-700 mb-6 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-navy-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {t.avatar}
                </div>
                <div>
                  <div className="font-semibold text-navy-500">{t.name}</div>
                  <div className="text-sm text-gray-500">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
