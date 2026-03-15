'use client';

import { motion } from 'framer-motion';
import Avatar from '@/components/ui/Avatar';

function TreeNode({ node, level = 0 }) {
  const colors = ['bg-navy-500', 'bg-teal-500', 'bg-green-500', 'bg-orange-500'];
  const color = colors[level % colors.length];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: level * 0.1 }}
      className="flex flex-col items-center"
    >
      <div className="flex flex-col items-center gap-1">
        <div className={`w-10 h-10 ${color} rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md`}>
          {node.name?.charAt(0) || '?'}
        </div>
        <div className="text-center">
          <div className="text-xs font-semibold text-navy-500 truncate max-w-20">{node.name}</div>
          <div className="text-xs text-gray-400">Gen {node.generation_level}</div>
        </div>
      </div>
    </motion.div>
  );
}

export default function DiscipleshipTree({ students = [] }) {
  const byLevel = students.reduce((acc, s) => {
    const gen = s.generation_level || 0;
    if (!acc[gen]) acc[gen] = [];
    acc[gen].push(s);
    return acc;
  }, {});

  if (!students.length) {
    return (
      <div className="text-center py-12 text-gray-400">
        <div className="text-4xl mb-3">🌱</div>
        <p>Your discipleship tree will grow here as you invite others.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-full flex flex-col gap-8 py-4">
        {Object.keys(byLevel).sort().map((level) => (
          <div key={level} className="flex flex-col gap-2">
            <div className="text-sm font-semibold text-gray-500 text-center">Generation {level}</div>
            <div className="flex flex-wrap justify-center gap-4">
              {byLevel[level].map((student) => (
                <TreeNode key={student.id} node={student} level={parseInt(level)} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
