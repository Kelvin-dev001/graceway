'use client';

import { motion } from 'framer-motion';

export default function AchievementCard({ achievement, earned = false }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`p-4 rounded-2xl border-2 transition-all ${
        earned
          ? 'border-green-400 bg-green-50 shadow-md'
          : 'border-gray-200 bg-gray-50 opacity-50'
      }`}
    >
      <div className="text-3xl mb-2">{achievement.badge_icon || '🏆'}</div>
      <h4 className="font-bold text-navy-500 text-sm">{achievement.title}</h4>
      <p className="text-xs text-gray-500 mt-1">{achievement.description}</p>
      {earned && (
        <span className="inline-block mt-2 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">
          ✓ Earned
        </span>
      )}
    </motion.div>
  );
}
