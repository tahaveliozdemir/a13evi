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

export interface VetoRule {
  enabled: boolean;
  zeroCount: number; // X tane 0 varsa ödül alamaz
}

export interface CancelRule {
  enabled: boolean;
  highScore: number; // İptal eden yüksek puan (varsayılan: 2)
  highCount: number; // Kaç tane yüksek puan gerekli
  lowScore: number; // İptal edilen düşük puan (varsayılan: 0)
  lowCount: number; // Kaç tane düşük puan iptal edilir
}

export interface AppSettings {
  categories: string[];
  threshold: number; // Kazanım eşiği (0.0 - 2.0 arası, varsayılan: 1.5)
  scoreSystem: {
    min: number; // Minimum puan (varsayılan: 0)
    max: number; // Maximum puan (varsayılan: 2)
  };
  vetoRule: VetoRule;
  cancelRule: CancelRule;
  periods: Period[];
  // Eski alanlar - geriye dönük uyumluluk için
  calcType?: 'neutral' | 'normal';
  vetoFives?: number;
  vetoOnes?: number;
  cancelThreshold?: number;
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
  average: number | null; // Genel ortalama
  remainingZeros: number; // Kalan 0'lar (veto/iptal sonrası)
  totalScores: number; // Toplam puan sayısı
  vetoApplied: boolean; // Veto kuralı uygulandı mı
  periods: Array<{
    average: number;
    remainingZeros: number;
    achieved: boolean;
    daysCount: number;
    vetoApplied: boolean;
  } | null>;
  // Eski alanlar - geriye dönük uyumluluk için
  normalAvg?: number | null;
  neutralAvg?: {
    average: number;
    remainingOnes: number;
    totalScores: number;
  } | null;
}

// UI State
export interface UnsavedChanges {
  [childId: string]: {
    scores: { [categoryIndex: number]: number };
    descriptions: { [categoryIndex: number]: string };
    absent: boolean;
  };
}
