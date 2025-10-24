interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export default function LoadingSpinner({
  message = 'Yükleniyor...',
  fullScreen = true,
  size = 'medium'
}: LoadingSpinnerProps) {
  const sizeClasses = {
    small: 'h-6 w-6',
    medium: 'h-12 w-12',
    large: 'h-16 w-16'
  };

  const spinner = (
    <div className="text-center">
      <div className={`animate-spin rounded-full ${sizeClasses[size]} border-b-2 border-accent mx-auto mb-4`}></div>
      <p className="text-text-muted">{message}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        {spinner}
      </div>
    );
  }

  return spinner;
}
