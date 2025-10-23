import { useState } from 'react';
import type { Child, AppSettings, UnsavedChanges } from '../types';
import { calculateChildStats, getAverageColor } from '../utils/calculations';
import Badge from './ui/Badge';
import ProgressBar from './ui/ProgressBar';

interface ChildCardV2Props {
  child: Child;
  settings: AppSettings;
  unsavedChanges: UnsavedChanges[string];
  onScoreClick: (categoryIndex: number, score: number) => void;
  onAbsentToggle: () => void;
  onDescriptionClick: (categoryIndex: number) => void;
  isAdmin: boolean;
  onDelete?: () => void;
  onQuickFill?: (score: number) => void;
  onCopyLast?: () => void;
}

const SCORE_COLORS = {
  5: { bg: '#059669', text: 'text-emerald-600' },
  4: { bg: '#65a30d', text: 'text-lime-600' },
  3: { bg: '#eab308', text: 'text-yellow-600' },
  2: { bg: '#f97316', text: 'text-orange-600' },
  1: { bg: '#dc2626', text: 'text-red-600' }
};

export default function ChildCardV2({
  child,
  settings,
  unsavedChanges,
  onScoreClick,
  onAbsentToggle,
  onDescriptionClick,
  isAdmin,
  onDelete,
  onQuickFill,
  onCopyLast
}: ChildCardV2Props) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showQuickActions, setShowQuickActions] = useState(false);

  const stats = calculateChildStats(child, settings);
  const completedCategories = unsavedChanges ? Object.keys(unsavedChanges.scores).length : 0;
  const totalCategories = settings.categories.length;
  const isComplete = completedCategories === totalCategories;
  const isAbsent = unsavedChanges?.absent || false;

  // Calculate status
  const getStatus = () => {
    if (isAbsent) return { label: 'Yok', variant: 'absent' as const };
    if (isComplete) return { label: 'Tamamlandı', variant: 'completed' as const };
    if (completedCategories > 0) return { label: 'Devam Ediyor', variant: 'in-progress' as const };
    return { label: 'Boş', variant: 'empty' as const };
  };

  const status = getStatus();

  // Get last evaluation date
  const lastEvalDate = child.scores && child.scores.length > 0
    ? new Date(child.scores[0].date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
    : null;

  // Calculate trend (comparing last 2 evaluations)
  const getTrend = () => {
    if (!child.scores || child.scores.length < 2) return null;

    const recent = child.scores[0];
    const previous = child.scores[1];

    const recentAvg = calculateAverage(recent);
    const previousAvg = calculateAverage(previous);

    if (recentAvg === null || previousAvg === null) return null;

    const diff = recentAvg - previousAvg;
    if (Math.abs(diff) < 0.1) return { icon: '→', color: 'text-gray-500', label: 'Stabil' };
    if (diff > 0) return { icon: '↑', color: 'text-emerald-500', label: 'İyileşiyor' };
    return { icon: '↓', color: 'text-red-500', label: 'Düşüyor' };
  };

  const calculateAverage = (scoreEntry: any) => {
    const scores: number[] = [];
    for (let i = 1; i <= settings.categories.length; i++) {
      const scoreKey = `s${i}` as keyof typeof scoreEntry;
      if (scoreEntry[scoreKey] !== undefined) {
        scores.push(scoreEntry[scoreKey] as number);
      }
    }
    return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
  };

  const trend = getTrend();

  // Check achievement status
  const achievementStatus = stats.periods.map((period, idx) => ({
    name: settings.periods[idx].name,
    achieved: period?.achieved || false,
    days: period?.daysCount || 0
  }));

  // Missing categories
  const missingCategories = settings.categories
    .map((cat, idx) => unsavedChanges?.scores[idx] === undefined ? cat : null)
    .filter(Boolean);

  return (
    <div
      className={`
        card overflow-hidden transition-all duration-300
        ${isComplete && !isAbsent ? 'border-l-4 border-l-emerald-500 shadow-emerald-500/10 shadow-lg' : ''}
        ${isAbsent ? 'opacity-60' : ''}
      `}
    >
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-bold text-xl">{child.name}</h3>
              <Badge variant={status.variant}>{status.label}</Badge>
              {trend && (
                <span className={`text-lg ${trend.color}`} title={trend.label}>
                  {trend.icon}
                </span>
              )}
            </div>

            {/* Stats Row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
              <span>
                Normal: <strong className={getAverageColor(stats.normalAvg)}>
                  {stats.normalAvg !== null ? stats.normalAvg.toFixed(2) : '-'}
                </strong>
              </span>
              <span>
                Nötr: <strong className={getAverageColor(stats.neutralAvg?.average || null)}>
                  {stats.neutralAvg && stats.neutralAvg.average !== null ? stats.neutralAvg.average.toFixed(2) : '-'}
                </strong>
              </span>
              {lastEvalDate && (
                <span className="text-text-muted">
                  Son: {lastEvalDate}
                </span>
              )}
              {achievementStatus.filter(a => a.achieved).length > 0 && (
                <div className="flex gap-1">
                  {achievementStatus.map((ach, idx) => ach.achieved && (
                    <Badge key={idx} variant="achieved" size="sm">
                      ✓ {ach.days} gün
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Quick Actions Toggle */}
            <button
              onClick={() => setShowQuickActions(!showQuickActions)}
              className="p-2 hover:bg-input-bg rounded-lg transition"
              title="Hızlı İşlemler"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </button>

            {/* Expand/Collapse */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 hover:bg-input-bg rounded-lg transition"
            >
              <svg
                className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Delete (Admin) */}
            {isAdmin && onDelete && (
              <button
                onClick={onDelete}
                className="p-2 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {!isAbsent && (
          <ProgressBar current={completedCategories} total={totalCategories} />
        )}

        {/* Missing Categories Warning */}
        {!isAbsent && completedCategories > 0 && missingCategories.length > 0 && (
          <div className="mt-3 p-2 bg-orange-500/10 border border-orange-500/30 rounded-lg text-xs text-orange-600 dark:text-orange-400">
            ⚠️ Eksik: {missingCategories.join(', ')}
          </div>
        )}

        {/* Quick Actions Panel */}
        {showQuickActions && !isAbsent && (
          <div className="mt-3 p-3 bg-input-bg rounded-lg border border-input-border space-y-2 animate-scaleIn">
            <p className="text-xs font-medium text-text-muted mb-2">Hızlı Doldur:</p>
            <div className="flex gap-2">
              {[5, 4, 3, 2, 1].map(score => (
                <button
                  key={score}
                  onClick={() => onQuickFill?.(score)}
                  className="flex-1 py-3 md:py-2 rounded-lg font-bold text-sm transition-all hover:scale-105"
                  style={{
                    backgroundColor: SCORE_COLORS[score as keyof typeof SCORE_COLORS].bg,
                    color: 'white'
                  }}
                >
                  Hepsi {score}
                </button>
              ))}
            </div>
            {onCopyLast && child.scores && child.scores.length > 0 && (
              <button
                onClick={onCopyLast}
                className="w-full py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg font-medium text-sm transition flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Son Değerlendirmeyi Kopyala
              </button>
            )}
          </div>
        )}
      </div>

      {/* Categories (Collapsible) */}
      {isExpanded && (
        <div className="border-t border-card-border">
          {settings.categories.map((category, catIndex) => {
            const selectedScore = unsavedChanges?.scores[catIndex];
            const hasDescription = unsavedChanges?.descriptions?.[catIndex];

            return (
              <div
                key={catIndex}
                className="border-b border-card-border last:border-b-0 p-4 hover:bg-input-bg/30 transition"
              >
                {/* Category Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{category}</span>
                    {selectedScore !== undefined && (
                      <span className={`text-xs font-bold ${SCORE_COLORS[selectedScore as keyof typeof SCORE_COLORS].text}`}>
                        {selectedScore}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => onDescriptionClick(catIndex)}
                    className="p-2 md:p-1.5 hover:bg-input-bg rounded-lg transition"
                    title={hasDescription ? "Not var" : "Not ekle"}
                  >
                    {hasDescription ? (
                      <svg className="w-4 h-4 text-accent" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Description Preview */}
                {hasDescription && (
                  <div className="mb-2 p-2 bg-accent/5 border border-accent/20 rounded text-xs text-text-muted italic">
                    "{unsavedChanges.descriptions[catIndex]}"
                  </div>
                )}

                {/* Score Buttons */}
                <div className="flex gap-2">
                  {[5, 4, 3, 2, 1].map(score => {
                    const isSelected = selectedScore === score;
                    const color = SCORE_COLORS[score as keyof typeof SCORE_COLORS].bg;

                    return (
                      <button
                        key={score}
                        onClick={() => onScoreClick(catIndex, score)}
                        disabled={isAbsent}
                        className={`
                          flex-1 py-3 md:py-2.5 rounded-lg font-bold transition-all
                          border-2 relative overflow-hidden
                          ${isSelected
                            ? 'text-white transform scale-110 shadow-lg z-10'
                            : 'text-foreground hover:bg-input-bg border-input-border hover:border-accent/50'
                          }
                          disabled:opacity-30 disabled:cursor-not-allowed
                        `}
                        style={isSelected ? {
                          backgroundColor: color,
                          borderColor: color
                        } : {}}
                      >
                        {score}
                        {isSelected && (
                          <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer: Absent Button */}
      <div className="p-4 border-t border-card-border bg-input-bg/20">
        <button
          onClick={onAbsentToggle}
          className={`
            w-full py-3 border-2 rounded-lg font-bold transition-all
            ${isAbsent
              ? 'bg-red-500 text-white border-red-500 shadow-lg'
              : 'text-text-muted hover:bg-input-bg border-input-border hover:border-red-500/50'
            }
          `}
        >
          {isAbsent ? '✓ Yok (İşaretli)' : 'Yok'}
        </button>
      </div>
    </div>
  );
}
