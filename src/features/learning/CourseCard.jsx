'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';

export default function CourseCard({ course, enrollment, progress = 0 }) {

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
    >
      {course.thumbnail ? (
        <img src={course.thumbnail} alt={course.title} className="w-full h-40 object-cover" />
      ) : (
        <div className="w-full h-40 bg-gradient-to-br from-navy-500 to-teal-500 flex items-center justify-center">
          <span className="text-5xl">📚</span>
        </div>
      )}

      <div className="p-5">
        <h3 className="font-bold text-navy-500 text-lg mb-2 line-clamp-2">{course.title}</h3>
        {course.description && (
          <p className="text-gray-500 text-sm mb-4 line-clamp-2">{course.description}</p>
        )}

        {enrollment && (
          <ProgressBar value={progress} max={100} label="Progress" className="mb-4" />
        )}

        <Link
          href={`/courses/${course.id}`}
          className="block w-full text-center bg-navy-500 hover:bg-navy-600 text-white py-2.5 rounded-xl font-semibold transition-colors text-sm"
        >
          {enrollment ? (progress > 0 ? 'Continue Learning' : 'Start Course') : 'View Course'}
        </Link>
      </div>
    </motion.div>
  );
}
