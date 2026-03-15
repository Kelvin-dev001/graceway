'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function ProgressBar({ value = 0, max = 100, label, className = '', color = 'green' }) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const colors = {
    green: 'bg-green-500',
    navy: 'bg-navy-500',
    orange: 'bg-orange-500',
    teal: 'bg-teal-500',
  };

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <span className="text-sm text-gray-500">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={cn('h-2.5 rounded-full', colors[color])}
        />
      </div>
    </div>
  );
}
