/**
 * Skeleton loader component for better loading UX
 * Shows placeholder while content is loading
 */

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave';
}

export default function Skeleton({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
}: SkeletonProps) {
  const baseClasses = 'bg-gray-300 dark:bg-gray-700';

  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${animationClasses[animation]}
        ${className}
      `}
      style={style}
    />
  );
}

/**
 * Pre-built skeleton components for common use cases
 */

export function SkeletonCard() {
  return (
    <div className="card p-6 space-y-4">
      <Skeleton height={24} width="60%" />
      <Skeleton height={16} width="40%" />
      <div className="space-y-2">
        <Skeleton height={12} width="100%" />
        <Skeleton height={12} width="90%" />
        <Skeleton height={12} width="95%" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <Skeleton height={40} width="100%" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} height={60} width="100%" />
      ))}
    </div>
  );
}

export function SkeletonStat() {
  return (
    <div className="card p-6 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton height={16} width={100} />
        <Skeleton variant="circular" width={24} height={24} />
      </div>
      <Skeleton height={32} width={80} />
      <Skeleton height={12} width={120} />
    </div>
  );
}
