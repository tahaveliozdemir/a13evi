import type { Child, AppSettings, UnsavedChanges } from '../types';
import { calculateChildStats, getAverageColor } from '../utils/calculations';

interface ChildCardProps {
  child: Child;
  settings: AppSettings;
  unsavedChanges: UnsavedChanges[string];
  onScoreClick: (categoryIndex: number, score: number) => void;
  onAbsentToggle: () => void;
  onDescriptionClick: (categoryIndex: number) => void;
  isAdmin: boolean;
  onDelete?: () => void;
}

const SCORE_COLORS = {
  2: '#059669', // emerald-600 (Başarılı)
  1: '#eab308', // yellow-500 (Orta)
  0: '#dc2626'  // red-600 (Yetersiz)
};

export default function ChildCard({
  child,
  settings,
  unsavedChanges,
  onScoreClick,
  onAbsentToggle,
  onDescriptionClick,
  isAdmin,
  onDelete
}: ChildCardProps) {
  const stats = calculateChildStats(child, settings);
  const hasAnyScores = unsavedChanges && Object.keys(unsavedChanges.scores).length > 0;

  return (
    <div className={`card p-6 relative ${hasAnyScores ? 'border-l-4 border-l-accent' : ''}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-lg">{child.name}</h3>
          <div className="text-xs text-text-muted mt-1 space-x-3">
            <span>
              Ortalama: <strong className={getAverageColor(stats.average ?? null, settings)}>
                {stats.average !== null && stats.average !== undefined ? stats.average.toFixed(2) : '-'}
              </strong>
            </span>
            {stats.vetoApplied && (
              <span className="text-red-500 font-semibold">⚠ Veto</span>
            )}
          </div>
        </div>

        {/* Delete Button (Admin Only) */}
        {isAdmin && onDelete && (
          <button
            onClick={onDelete}
            className="text-text-muted hover:text-red-500 transition p-2 rounded-full"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {/* Categories */}
      <div className="space-y-0 border border-card-border rounded-lg overflow-hidden mb-4">
        {settings.categories.map((category, catIndex) => {
          const selectedScore = unsavedChanges?.scores[catIndex];
          const hasDescription = unsavedChanges?.descriptions?.[catIndex];

          return (
            <div
              key={catIndex}
              className="border-b border-card-border last:border-b-0 p-3"
            >
              {/* Category Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{category}</span>
                  <button
                    onClick={() => onDescriptionClick(catIndex)}
                    className="p-1 hover:bg-input-bg rounded transition"
                    title={hasDescription ? "Not var" : "Not ekle"}
                  >
                    {hasDescription ? (
                      // Filled icon (has description)
                      <svg className="w-4 h-4 text-accent" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" />
                      </svg>
                    ) : (
                      // Outline icon (no description)
                      <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Score Buttons - NEW 0-1-2 SYSTEM */}
              <div className="flex gap-2">
                {[2, 1, 0].map(score => {
                  const isSelected = selectedScore === score;
                  const color = SCORE_COLORS[score as keyof typeof SCORE_COLORS];
                  const labels = { 2: 'Başarılı', 1: 'Orta', 0: 'Yetersiz' };

                  return (
                    <button
                      key={score}
                      onClick={() => onScoreClick(catIndex, score)}
                      disabled={unsavedChanges?.absent}
                      className={`
                        flex-1 py-3 rounded-lg font-bold transition-all
                        border-2 flex flex-col items-center gap-1
                        ${isSelected
                          ? 'text-white transform scale-105 shadow-lg'
                          : 'text-foreground hover:bg-input-bg border-input-border'
                        }
                        disabled:opacity-50 disabled:cursor-not-allowed
                      `}
                      style={isSelected ? {
                        backgroundColor: color,
                        borderColor: color
                      } : {}}
                      title={labels[score as keyof typeof labels]}
                    >
                      <span className="text-2xl">{score}</span>
                      <span className="text-[10px] opacity-75">{labels[score as keyof typeof labels]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Absent Button */}
      <button
        onClick={onAbsentToggle}
        className={`
          w-full py-2.5 border-2 rounded-lg font-bold transition
          ${unsavedChanges?.absent
            ? 'bg-red-500 text-white border-red-500'
            : 'text-text-muted hover:bg-input-bg border-input-border'
          }
        `}
      >
        {unsavedChanges?.absent ? 'Yok (İşaretli)' : 'Yok'}
      </button>
    </div>
  );
}
