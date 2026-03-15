'use client';

import { motion } from 'framer-motion';

export default function AnalyticsDashboard({ stats }) {
  const cards = [
    { label: 'Total Users', value: stats?.totalUsers || 0, icon: '👥', color: 'from-navy-500 to-navy-600' },
    { label: 'Total Courses', value: stats?.totalCourses || 0, icon: '📚', color: 'from-teal-500 to-teal-600' },
    { label: 'Certificates Issued', value: stats?.totalCertificates || 0, icon: '📜', color: 'from-green-500 to-green-600' },
    { label: 'Leaders', value: stats?.totalLeaders || 0, icon: '👑', color: 'from-orange-500 to-orange-600' },
    { label: 'New This Month', value: stats?.newUsersThisMonth || 0, icon: '🌱', color: 'from-purple-500 to-purple-600' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className={`bg-gradient-to-br ${card.color} rounded-2xl p-5 text-white shadow-md`}
        >
          <div className="text-3xl mb-2">{card.icon}</div>
          <div className="text-3xl font-extrabold mb-1">{card.value.toLocaleString()}</div>
          <div className="text-sm opacity-80">{card.label}</div>
        </motion.div>
      ))}
    </div>
  );
}
