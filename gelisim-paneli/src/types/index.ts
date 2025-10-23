// Child & Scores
export interface ScoreEntry {
  date: string;
  evaluator: string;
  s1?: number; // Score for category 1
  s2?: number; // Score for category 2
  s3?: number; // Score for category 3
  s4?: number; // Score for category 4
  descriptions?: { [categoryIndex: number]: string };
}

export interface Child {
  id: string;
  name: string;
  scores: ScoreEntry[];
  archived?: boolean;
  createdAt?: string;
}

// Settings
export interface Period {
  days: number;
  name: string;
}

export interface AppSettings {
  categories: string[];
  threshold: number;
  calcType: 'neutral' | 'normal';
  vetoFives: number;
  vetoOnes: number;
  cancelThreshold: number;
  periods: Period[];
}

// User & Auth
export interface UserRole {
  uid: string;
  email: string | null;
  role: 'admin' | 'staff' | 'viewer';
  displayName?: string;
}

export interface AuthUser {
  uid: string;
  email: string | null;
  isAnonymous: boolean;
  role?: 'admin' | 'staff' | 'viewer';
}

// Statistics
export interface ChildStats {
  normalAvg: number | null;
  neutralAvg: {
    average: number;
    remainingOnes: number;
    totalScores: number;
  } | null;
  periods: Array<{
    average: number;
    remainingOnes: number;
    achieved: boolean;
    daysCount: number;
  } | null>;
}

// UI State
export interface UnsavedChanges {
  [childId: string]: {
    scores: { [categoryIndex: number]: number };
    descriptions: { [categoryIndex: number]: string };
    absent: boolean;
  };
}
