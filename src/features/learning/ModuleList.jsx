'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Badge from '@/components/ui/Badge';

export default function ModuleList({ modules = [], completedLessons = [] }) {
  const [openModule, setOpenModule] = useState(null);

  return (
    <div className="flex flex-col gap-3">
      {modules.map((module, i) => {
        const lessons = module.sections?.flatMap(s => s.lessons || []) || [];
        const completed = lessons.filter(l => completedLessons.includes(l.id)).length;
        const isOpen = openModule === module.id;

        return (
          <div key={module.id} className="border border-gray-200 rounded-2xl overflow-hidden">
            <button
              onClick={() => setOpenModule(isOpen ? null : module.id)}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-navy-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {i + 1}
                </div>
                <div>
                  <h3 className="font-semibold text-navy-500">{module.title}</h3>
                  <p className="text-xs text-gray-500">{completed}/{lessons.length} lessons completed</p>
                </div>
              </div>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 flex flex-col gap-2">
                    {module.sections?.map((section) => (
                      <div key={section.id}>
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{section.title}</h4>
                        {section.lessons?.map((lesson) => {
                          const isDone = completedLessons.includes(lesson.id);
                          return (
                            <Link
                              key={lesson.id}
                              href={`/lessons/${lesson.id}`}
                              className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors group"
                            >
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${isDone ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                {isDone ? '✓' : lesson.order_index + 1}
                              </div>
                              <span className={`text-sm ${isDone ? 'text-gray-400 line-through' : 'text-gray-700 group-hover:text-navy-500'}`}>
                                {lesson.title}
                              </span>
                              {lesson.duration_minutes > 0 && (
                                <span className="ml-auto text-xs text-gray-400">{lesson.duration_minutes}m</span>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
