'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function Card({ children, className = '', hover = false, onClick, ...props }) {
  const Component = hover || onClick ? motion.div : 'div';
  const motionProps = hover || onClick ? {
    whileHover: { y: -4, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)' },
    transition: { duration: 0.2 },
  } : {};

  return (
    <Component
      className={cn(
        'bg-white rounded-2xl shadow-sm border border-gray-100 p-6',
        (hover || onClick) && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      {...motionProps}
      {...props}
    >
      {children}
    </Component>
  );
}
