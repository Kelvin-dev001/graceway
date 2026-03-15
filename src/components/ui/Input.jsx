'use client';

import { cn } from '@/lib/utils';

export default function Input({
  label,
  error,
  helper,
  className = '',
  inputClassName = '',
  type = 'text',
  ...props
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        type={type}
        className={cn(
          'w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400',
          'focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent',
          'transition-all duration-200',
          error && 'border-red-400 focus:ring-red-400',
          inputClassName
        )}
        {...props}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      {helper && !error && <p className="text-sm text-gray-500">{helper}</p>}
    </div>
  );
}
