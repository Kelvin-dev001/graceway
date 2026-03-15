'use client';

import { motion } from 'framer-motion';

export default function GenerationStats({ generationStats = [] }) {
  const maxCount = Math.max(...generationStats.map(g => Number(g.total_count)), 1);

  if (!generationStats.length) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p>No generation data yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {generationStats.map((stat, i) => (
        <div key={stat.generation} className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-600 w-20 flex-shrink-0">Gen {stat.generation}</span>
          <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(Number(stat.total_count) / maxCount) * 100}%` }}
              transition={{ duration: 0.8, delay: i * 0.1 }}
              className="h-3 rounded-full bg-gradient-to-r from-navy-500 to-teal-500"
            />
          </div>
          <span className="text-sm font-bold text-navy-500 w-8 text-right">{stat.total_count}</span>
        </div>
      ))}
    </div>
  );
}
