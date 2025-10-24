interface ProgressBarProps {
  current: number;
  total: number;
  showLabel?: boolean;
}

export default function ProgressBar({ current, total, showLabel = true }: ProgressBarProps) {
  const percentage = total > 0 ? (current / total) * 100 : 0;

  const getColor = () => {
    if (percentage === 100) return 'bg-emerald-500';
    if (percentage >= 75) return 'bg-lime-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 25) return 'bg-orange-500';
    return 'bg-gray-400';
  };

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-xs text-text-muted mb-1">
          <span>İlerleme</span>
          <span className="font-medium">{current}/{total}</span>
        </div>
      )}
      <div className="h-2 bg-input-bg rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${getColor()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
