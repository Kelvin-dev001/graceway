'use client';

import { motion } from 'framer-motion';

export default function LeaderStats({ stats }) {
  const cards = [
    { label: 'Total Students', value: stats?.totalStudents || 0, icon: '👥', color: 'bg-navy-50 text-navy-700' },
    { label: 'New This Month', value: stats?.newThisMonth || 0, icon: '🌱', color: 'bg-green-50 text-green-700' },
    { label: 'Generations', value: stats?.generationStats?.length || 0, icon: '🌳', color: 'bg-teal-50 text-teal-700' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className={`${card.color} rounded-2xl p-5 border border-gray-100`}
        >
          <div className="text-2xl mb-2">{card.icon}</div>
          <div className="text-3xl font-extrabold mb-1">{card.value}</div>
          <div className="text-sm font-medium opacity-80">{card.label}</div>
        </motion.div>
      ))}
    </div>
  );
}
