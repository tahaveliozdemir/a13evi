interface BadgeProps {
  children: React.ReactNode;
  variant?: 'completed' | 'in-progress' | 'absent' | 'empty' | 'achieved' | 'warning';
  size?: 'sm' | 'md';
}

const VARIANT_STYLES = {
  completed: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  'in-progress': 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
  absent: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
  empty: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/30',
  achieved: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
  warning: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30'
};

export default function Badge({ children, variant = 'empty', size = 'sm' }: BadgeProps) {
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium border ${VARIANT_STYLES[variant]} ${sizeClass}`}>
      {children}
    </span>
  );
}
