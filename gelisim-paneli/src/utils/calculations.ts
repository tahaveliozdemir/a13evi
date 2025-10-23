import type { Child, AppSettings, ChildStats } from '../types';

/**
 * Calculate neutral average with veto rule
 * Orijinal mantık: calculateNeutralAverage()
 */
export function calculateNeutralAverage(
  scores: number[],
  settings: AppSettings
): {
  average: number;
  remainingOnes: number;
  totalScores: number;
} | null {
  if (!scores || scores.length === 0) return null;

  const allScores = [...scores];
  let fives = allScores.filter(s => s === 5).length;
  let ones = allScores.filter(s => s === 1).length;

  // Apply veto rule: vetoFives amount of 5s cancel vetoOnes amount of 1s
  const { vetoFives, vetoOnes } = settings;
  while (fives >= vetoFives && ones >= vetoOnes) {
    fives -= vetoFives;
    ones -= vetoOnes;
  }

  // Remove cancelled scores
  let remainingScores = [...allScores];
  const fivesToRemove = allScores.filter(s => s === 5).length - fives;
  const onesToRemove = allScores.filter(s => s === 1).length - ones;

  for (let i = 0; i < fivesToRemove; i++) {
    const idx = remainingScores.indexOf(5);
    if (idx !== -1) remainingScores.splice(idx, 1);
  }
  for (let i = 0; i < onesToRemove; i++) {
    const idx = remainingScores.indexOf(1);
    if (idx !== -1) remainingScores.splice(idx, 1);
  }

  // Check remaining ones
  const remainingOnes = remainingScores.filter(s => s === 1).length;

  if (remainingScores.length === 0) return null;

  const avg = remainingScores.reduce((a, b) => a + b, 0) / remainingScores.length;

  return {
    average: avg,
    remainingOnes: remainingOnes,
    totalScores: remainingScores.length
  };
}

/**
 * Calculate normal average
 * Orijinal mantık: calculateNormalAverage()
 */
export function calculateNormalAverage(scores: number[]): number | null {
  if (!scores || scores.length === 0) return null;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

/**
 * Get color class for average score
 * Orijinal mantık: getAverageColor()
 */
export function getAverageColor(avg: number | null): string {
  if (avg === null) return 'text-text-muted';
  if (avg >= 4.5) return 'text-emerald-500';
  if (avg >= 3.75) return 'text-lime-500';
  if (avg >= 3.25) return 'text-yellow-500';
  if (avg >= 2.5) return 'text-orange-500';
  return 'text-red-500';
}

/**
 * Calculate child statistics
 * Orijinal mantık: calculateChildStats()
 */
export function calculateChildStats(child: Child, settings: AppSettings): ChildStats {
  if (!child.scores || child.scores.length === 0) {
    return {
      normalAvg: null,
      neutralAvg: null,
      periods: settings.periods.map(() => null)
    };
  }

  // Get all scores as flat array
  const allScoreValues = child.scores.flatMap(scoreEntry => {
    const values: number[] = [];
    for (let i = 1; i <= settings.categories.length; i++) {
      const scoreKey = `s${i}` as keyof typeof scoreEntry;
      if (scoreEntry[scoreKey] !== undefined) {
        values.push(scoreEntry[scoreKey] as number);
      }
    }
    return values;
  });

  const normalAvg = calculateNormalAverage(allScoreValues);
  const neutralResult = calculateNeutralAverage(allScoreValues, settings);

  // Calculate period stats
  const uniqueDates = [...new Set(child.scores.map(s => s.date))].sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  const periodStats = settings.periods.map(period => {
    const relevantDates = uniqueDates.slice(0, period.days);
    const periodScores = child.scores
      .filter(s => relevantDates.includes(s.date))
      .flatMap(scoreEntry => {
        const values: number[] = [];
        for (let i = 1; i <= settings.categories.length; i++) {
          const scoreKey = `s${i}` as keyof typeof scoreEntry;
          if (scoreEntry[scoreKey] !== undefined) {
            values.push(scoreEntry[scoreKey] as number);
          }
        }
        return values;
      });

    if (periodScores.length === 0) return null;

    const calcType = settings.calcType;
    let result;
    let achieved = false;

    if (calcType === 'neutral') {
      result = calculateNeutralAverage(periodScores, settings);
      if (result) {
        // Check cancel threshold
        if (settings.cancelThreshold > 0 && result.remainingOnes >= settings.cancelThreshold) {
          achieved = false;
        } else if (result.average >= settings.threshold) {
          achieved = true;
        }
      }
    } else {
      const avg = calculateNormalAverage(periodScores);
      result = avg !== null ? { average: avg, remainingOnes: 0, totalScores: periodScores.length } : null;
      if (avg !== null && avg >= settings.threshold) {
        achieved = true;
      }
    }

    return result ? {
      ...result,
      achieved,
      daysCount: relevantDates.length
    } : null;
  });

  return {
    normalAvg,
    neutralAvg: neutralResult,
    periods: periodStats
  };
}

/**
 * Format date to Turkish locale
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
