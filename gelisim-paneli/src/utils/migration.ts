import type { Child, AppSettings, ScoreEntry } from '../types';

/**
 * Migrates score from 1-5 system to 0-2 system
 * 1-2 → 0 (Yetersiz)
 * 3 → 1 (Orta)
 * 4-5 → 2 (Başarılı)
 */
export function migrateScore(oldScore: number): number {
  if (oldScore <= 2) return 0;
  if (oldScore === 3) return 1;
  return 2; // 4-5
}

/**
 * Migrates a single score entry
 */
export function migrateScoreEntry(entry: ScoreEntry): ScoreEntry {
  const newEntry = { ...entry };

  // Migrate all score fields (s1, s2, s3, s4, etc.)
  Object.keys(entry).forEach(key => {
    if (key.startsWith('s') && typeof entry[key as keyof ScoreEntry] === 'number') {
      const oldScore = entry[key as keyof ScoreEntry] as number;
      (newEntry as any)[key] = migrateScore(oldScore);
    }
  });

  return newEntry;
}

/**
 * Migrates a child's all scores
 */
export function migrateChild(child: Child): Child {
  return {
    ...child,
    scores: child.scores.map(migrateScoreEntry)
  };
}

/**
 * Migrates all children
 */
export function migrateChildren(children: Child[]): Child[] {
  return children.map(migrateChild);
}

/**
 * Migrates app settings from old system to new system
 */
export function migrateSettings(oldSettings: AppSettings): AppSettings {
  // If already migrated, return as is
  if (oldSettings.scoreSystem) {
    return oldSettings;
  }

  // Create new settings with defaults
  const newSettings: AppSettings = {
    categories: oldSettings.categories,
    units: oldSettings.units || [], // Preserve existing units or use empty array
    threshold: 1.5, // New default threshold for 0-2 system
    scoreSystem: {
      min: 0,
      max: 2
    },
    vetoRule: {
      enabled: false,
      zeroCount: 3 // Varsayılan: 3 tane 0 varsa ödül yok
    },
    cancelRule: {
      enabled: false,
      highScore: 2,
      highCount: 2, // Varsayılan: 2 tane 2
      lowScore: 0,
      lowCount: 1 // Varsayılan: 1 tane 0'ı iptal eder
    },
    periods: oldSettings.periods
  };

  // Migrate old veto rules if they existed
  if (oldSettings.vetoFives !== undefined && oldSettings.vetoOnes !== undefined) {
    // Old system: vetoFives amount of 5s cancel vetoOnes amount of 1s
    // New system: we'll enable cancel rule with converted values
    newSettings.cancelRule.enabled = true;
    newSettings.cancelRule.highCount = oldSettings.vetoFives;
    newSettings.cancelRule.lowCount = oldSettings.vetoOnes;
  }

  return newSettings;
}

/**
 * Check if data needs migration
 */
export function needsMigration(settings: AppSettings): boolean {
  return !settings.scoreSystem;
}

/**
 * Check if a score value is from old system (1-5)
 */
export function isOldSystemScore(score: number): boolean {
  return score >= 3; // In new system (0-2), max is 2
}
