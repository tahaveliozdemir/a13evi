interface SkeletonLoaderProps {
  variant?: 'card' | 'text' | 'circle' | 'stat' | 'table';
  count?: number;
  className?: string;
}

export default function SkeletonLoader({
  variant = 'card',
  count = 1,
  className = ''
}: SkeletonLoaderProps) {

  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return (
          <div className={`card p-6 animate-pulse ${className}`}>
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded"></div>
              <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-5/6"></div>
            </div>
          </div>
        );

      case 'text':
        return (
          <div className={`animate-pulse ${className}`}>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6"></div>
          </div>
        );

      case 'circle':
        return (
          <div className={`animate-pulse ${className}`}>
            <div className="h-12 w-12 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
          </div>
        );

      case 'stat':
        return (
          <div className={`card p-6 animate-pulse ${className}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/3"></div>
              <div className="h-8 w-8 bg-gray-300 dark:bg-gray-700 rounded"></div>
            </div>
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
        );

      case 'table':
        return (
          <div className={`card p-6 animate-pulse ${className}`}>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-gray-300 dark:bg-gray-700 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {[...Array(count)].map((_, index) => (
        <div key={index}>
          {renderSkeleton()}
        </div>
      ))}
    </>
  );
}
