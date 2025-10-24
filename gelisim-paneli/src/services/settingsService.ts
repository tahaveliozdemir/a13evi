import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { AppSettings } from '../types';

const SETTINGS_DOC = 'settings/app_config';

// Default settings for NEW SYSTEM (0-1-2)
const defaultSettings: AppSettings = {
  categories: ['Kişisel Görevler', 'Ortak Alan', 'Eğitim', 'Genel Tutum'],
  threshold: 1.5, // Kazanım eşiği (0.0 - 2.0 arası)
  scoreSystem: {
    min: 0,
    max: 2
  },
  vetoRule: {
    enabled: false,
    zeroCount: 3 // 3 tane 0 varsa ödül yok
  },
  cancelRule: {
    enabled: false,
    highScore: 2,
    highCount: 2, // 2 tane 2
    lowScore: 0,
    lowCount: 1 // 1 tane 0'ı iptal eder
  },
  periods: [
    { days: 6, name: '6 Günlük Kazanım' },
    { days: 12, name: '12 Günlük Kazanım' }
  ]
};

/**
 * Get app settings from Firestore
 * NO WEBSOCKET - Uses regular get()
 */
export async function getSettings(): Promise<AppSettings> {
  try {
    const docRef = doc(db, SETTINGS_DOC);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { ...defaultSettings, ...docSnap.data() } as AppSettings;
    }

    // If no settings exist, create default
    await setDoc(docRef, defaultSettings);
    return defaultSettings;
  } catch (error) {
    console.error('Error fetching settings:', error);
    return defaultSettings;
  }
}

/**
 * Save app settings to Firestore
 * NO WEBSOCKET - Uses regular setDoc()
 */
export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    const docRef = doc(db, SETTINGS_DOC);
    await setDoc(docRef, settings, { merge: true });
  } catch (error) {
    console.error('Error saving settings:', error);
    throw error;
  }
}

/**
 * Update specific setting fields
 */
export async function updateSettings(updates: Partial<AppSettings>): Promise<void> {
  const current = await getSettings();
  const updated = { ...current, ...updates };
  await saveSettings(updated);
}
