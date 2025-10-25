import { doc, getDoc, setDoc, onSnapshot, type Unsubscribe } from 'firebase/firestore';
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
 * Get app settings from Firestore (ONE-TIME READ)
 * For initial load or when real-time updates are not needed
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
 * Subscribe to real-time settings updates via WSS (Secure WebSocket)
 * Returns unsubscribe function to clean up listener
 *
 * @param onUpdate - Callback fired when settings change (real-time)
 * @param onError - Optional error handler
 * @returns Unsubscribe function
 */
export function subscribeToSettings(
  onUpdate: (settings: AppSettings) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const docRef = doc(db, SETTINGS_DOC);

  const unsubscribe = onSnapshot(
    docRef,
    async (docSnap) => {
      if (docSnap.exists()) {
        const settings = { ...defaultSettings, ...docSnap.data() } as AppSettings;
        onUpdate(settings);
      } else {
        // If no settings exist, create default
        await setDoc(docRef, defaultSettings);
        onUpdate(defaultSettings);
      }
    },
    (error) => {
      console.error('Error in settings subscription:', error);
      if (onError) {
        onError(error as Error);
      } else {
        // Fallback to default settings on error
        onUpdate(defaultSettings);
      }
    }
  );

  console.log('🔌 WSS Connected: Real-time settings sync active');
  return unsubscribe;
}

/**
 * Save app settings to Firestore
 * Changes will be automatically pushed to all connected clients via WSS
 */
export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    const docRef = doc(db, SETTINGS_DOC);
    await setDoc(docRef, settings, { merge: true });
    console.log('💾 Settings saved - Broadcasting to all clients via WSS');
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
