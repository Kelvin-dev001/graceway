import { getInitials } from '@/lib/utils';

const sizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-xl',
};

export default function Avatar({ src, name, size = 'md', className = '' }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        className={`rounded-full object-cover ${sizes[size]} ${className}`}
      />
    );
  }

  return (
    <div className={`rounded-full bg-navy-500 flex items-center justify-center text-white font-semibold ${sizes[size]} ${className}`}>
      {getInitials(name)}
    </div>
  );
}
