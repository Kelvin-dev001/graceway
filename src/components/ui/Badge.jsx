import { cn } from '@/lib/utils';

const variants = {
  default: 'bg-gray-100 text-gray-700',
  primary: 'bg-navy-100 text-navy-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  danger: 'bg-red-100 text-red-700',
  orange: 'bg-orange-100 text-orange-700',
  teal: 'bg-teal-100 text-teal-700',
};

export default function Badge({ children, variant = 'default', className = '' }) {
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  );
}
