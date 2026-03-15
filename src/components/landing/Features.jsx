'use client';

import { motion } from 'framer-motion';

const features = [
  {
    icon: '📚',
    title: 'Structured Learning',
    description: 'Progressive discipleship modules with videos, PDFs, and interactive lessons.',
    color: 'bg-navy-50',
  },
  {
    icon: '🧪',
    title: 'Quizzes & Exams',
    description: 'Test your knowledge with auto-graded quizzes and unlock next levels.',
    color: 'bg-green-50',
  },
  {
    icon: '📜',
    title: 'Certificates',
    description: 'Earn downloadable PDF certificates to share your achievements.',
    color: 'bg-orange-50',
  },
  {
    icon: '🌳',
    title: 'Discipleship Tree',
    description: 'Visualize your spiritual family tree and track every generation.',
    color: 'bg-teal-50',
  },
  {
    icon: '🔗',
    title: 'Referral System',
    description: 'Invite friends with your unique link and multiply the movement.',
    color: 'bg-purple-50',
  },
  {
    icon: '👑',
    title: 'Leadership Dashboard',
    description: 'Monitor your students\' progress and guide them to completion.',
    color: 'bg-yellow-50',
  },
];

export default function Features() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-navy-500 mb-4">Everything You Need to Grow</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            A complete discipleship platform built for the next generation of believers.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              className={`${feature.color} rounded-2xl p-6 border border-gray-100`}
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold text-navy-500 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
