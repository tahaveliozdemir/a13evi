import type { Child, AppSettings, ChildStats } from '../types';

/**
 * NEW SYSTEM: Calculate average with configurable veto and cancel rules
 * For 0-1-2 scoring system
 */
export function calculateAverageWithRules(
  scores: number[],
  settings: AppSettings
): {
  average: number;
  remainingZeros: number;
  totalScores: number;
  vetoApplied: boolean;
} | null {
  if (!scores || scores.length === 0) return null;

  const remainingScores = [...scores];
  let vetoApplied = false;

  // Apply cancel rule if enabled
  if (settings.cancelRule?.enabled) {
    const { highScore, highCount, lowScore, lowCount } = settings.cancelRule;

    let highScoreCount = remainingScores.filter(s => s === highScore).length;
    let lowScoreCount = remainingScores.filter(s => s === lowScore).length;

    // Cancel lowScore values with highScore values
    while (highScoreCount >= highCount && lowScoreCount >= lowCount) {
      highScoreCount -= highCount;
      lowScoreCount -= lowCount;
    }

    // Remove cancelled scores
    const highToRemove = remainingScores.filter(s => s === highScore).length - highScoreCount;
    const lowToRemove = remainingScores.filter(s => s === lowScore).length - lowScoreCount;

    for (let i = 0; i < highToRemove; i++) {
      const idx = remainingScores.indexOf(highScore);
      if (idx !== -1) remainingScores.splice(idx, 1);
    }
    for (let i = 0; i < lowToRemove; i++) {
      const idx = remainingScores.indexOf(lowScore);
      if (idx !== -1) remainingScores.splice(idx, 1);
    }
  }

  // Check veto rule if enabled
  const remainingZeros = remainingScores.filter(s => s === 0).length;
  if (settings.vetoRule?.enabled && remainingZeros >= settings.vetoRule.zeroCount) {
    vetoApplied = true;
    return {
      average: 0,
      remainingZeros,
      totalScores: remainingScores.length,
      vetoApplied
    };
  }

  // Calculate average
  if (remainingScores.length === 0) return null;

  const avg = remainingScores.reduce((a, b) => a + b, 0) / remainingScores.length;

  return {
    average: avg,
    remainingZeros,
    totalScores: remainingScores.length,
    vetoApplied
  };
}

/**
 * Get color class for average score (0-2 system)
 */
export function getAverageColor(avg: number | null, settings?: AppSettings): string {
  if (avg === null) return 'text-text-muted';

  const threshold = settings?.threshold ?? 1.5;

  // Renk skalası: 0-2 sistemi için
  if (avg >= threshold) return 'text-emerald-500'; // Başarılı (≥1.5)
  if (avg >= threshold * 0.66) return 'text-yellow-500'; // Orta (≥1.0)
  return 'text-red-500'; // Yetersiz (<1.0)
}

/**
 * Calculate child statistics with new system
 */
export function calculateChildStats(child: Child, settings: AppSettings): ChildStats {
  if (!child.scores || child.scores.length === 0) {
    return {
      average: null,
      remainingZeros: 0,
      totalScores: 0,
      vetoApplied: false,
      periods: settings.periods.map(() => null),
      // Backward compatibility
      normalAvg: null,
      neutralAvg: null
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

  // Calculate overall average with rules
  const overallResult = calculateAverageWithRules(allScoreValues, settings);

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

    const result = calculateAverageWithRules(periodScores, settings);

    if (!result) return null;

    // Check if achieved (average >= threshold and not vetoed)
    const achieved = !result.vetoApplied && result.average >= settings.threshold;

    return {
      average: result.average,
      remainingZeros: result.remainingZeros,
      achieved,
      daysCount: relevantDates.length,
      vetoApplied: result.vetoApplied
    };
  });

  return {
    average: overallResult?.average ?? null,
    remainingZeros: overallResult?.remainingZeros ?? 0,
    totalScores: overallResult?.totalScores ?? 0,
    vetoApplied: overallResult?.vetoApplied ?? false,
    periods: periodStats,
    // Backward compatibility - map to old structure
    normalAvg: overallResult?.average ?? null,
    neutralAvg: overallResult ? {
      average: overallResult.average,
      remainingOnes: overallResult.remainingZeros, // Map zeros to ones for backward compat
      totalScores: overallResult.totalScores
    } : null
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

// ============================================
// DEPRECATED: Old system functions
// Kept for backward compatibility
// ============================================

/**
 * @deprecated Use calculateAverageWithRules instead
 */
export function calculateNeutralAverage(
  scores: number[],
  settings: AppSettings
): {
  average: number;
  remainingOnes: number;
  totalScores: number;
} | null {
  // Fallback to new system
  const result = calculateAverageWithRules(scores, settings);
  if (!result) return null;

  return {
    average: result.average,
    remainingOnes: result.remainingZeros,
    totalScores: result.totalScores
  };
}

/**
 * @deprecated Use calculateAverageWithRules with rules disabled instead
 */
export function calculateNormalAverage(scores: number[]): number | null {
  if (!scores || scores.length === 0) return null;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}
