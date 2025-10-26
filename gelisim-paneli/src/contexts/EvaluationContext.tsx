import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { subscribeToChildren, saveChildren, getChildren } from '../services/childrenService';
import { subscribeToSettings, saveSettings, getSettings } from '../services/settingsService';
import type { Child, AppSettings, UnsavedChanges } from '../types';
import { needsMigration, migrateChildren, migrateSettings } from '../utils/migration';

interface EvaluationContextType {
  // State
  selectedDate: string | null;
  selectedEvaluator: string | null;
  children: Child[];
  settings: AppSettings | null;
  unsavedChanges: UnsavedChanges;
  loading: boolean;
  saving: boolean;
  isRealtimeConnected: boolean; // WSS connection status

  // Actions
  setEvaluationInfo: (date: string, evaluator: string) => void;
  updateScore: (childId: string, categoryIndex: number, score: number) => void;
  toggleAbsent: (childId: string) => void;
  updateDescription: (childId: string, categoryIndex: number, description: string) => void;
  quickFillChild: (childId: string, score: number) => void;
  copyLastEvaluation: (childId: string) => void;
  saveAll: (isAdmin: boolean) => Promise<{ success: boolean; error?: string }>;
  refreshChildren: () => Promise<void>;
  hasUnsavedChanges: () => boolean;
}

const EvaluationContext = createContext<EvaluationContextType | undefined>(undefined);

export function EvaluationProvider({ children: childrenProp }: { children: ReactNode }) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedEvaluator, setSelectedEvaluator] = useState<string | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [unsavedChanges, setUnsavedChanges] = useState<UnsavedChanges>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  // Setup WSS real-time listeners on mount (with auto-migration)
  useEffect(() => {
    let childrenUnsubscribe: (() => void) | null = null;
    let settingsUnsubscribe: (() => void) | null = null;

    async function setupRealtimeSync() {
      setLoading(true);
      try {
        // First, do one-time read for migration check
        let [childrenData, settingsData] = await Promise.all([
          getChildren(),
          getSettings()
        ]);

        // Auto-migrate if needed (only once)
        let migrated = false;

        if (needsMigration(settingsData)) {
          console.log('[Migration] Detected old scoring system (1-5), migrating to new system (0-1-2)...');

          // Migrate settings
          settingsData = migrateSettings(settingsData);
          console.log('[Migration] Settings migrated:', settingsData);

          // Migrate children scores
          childrenData = migrateChildren(childrenData);
          console.log(`[Migration] Migrated ${childrenData.length} children`);

          migrated = true;

          // Save migrated data
          await Promise.all([
            saveSettings(settingsData),
            saveChildren(childrenData)
          ]);

          console.log('[Migration] ✅ Migration completed and saved to Firebase!');
          console.log('[Migration] Old system: 1-2→0, 3→1, 4-5→2');
        } else {
          console.log('[Migration] No migration needed - already using new system (0-1-2)');
        }

        setChildren(childrenData);
        setSettings(settingsData);
        setLoading(false);

        // Now setup real-time WSS subscriptions
        console.log('[WSS] Setting up real-time subscriptions...');

        childrenUnsubscribe = subscribeToChildren(
          (updatedChildren) => {
            console.log('[WSS] Received real-time children update:', updatedChildren.length, 'children');
            setChildren(updatedChildren);
            setIsRealtimeConnected(true);
          },
          (error) => {
            console.error('[WSS] Children subscription error:', error);
            setIsRealtimeConnected(false);
          }
        );

        settingsUnsubscribe = subscribeToSettings(
          (updatedSettings) => {
            console.log('[WSS] Received real-time settings update');
            setSettings(updatedSettings);
            setIsRealtimeConnected(true);
          },
          (error) => {
            console.error('[WSS] Settings subscription error:', error);
            setIsRealtimeConnected(false);
          }
        );

        if (migrated) {
          // Show migration success message
          setTimeout(() => {
            if (window.confirm(
              '✅ Sistem başarıyla güncellendi!\n\n' +
              'Puanlama sistemi 1-5\'ten 0-1-2\'ye dönüştürüldü:\n' +
              '• 1-2 puan → 0 (Yetersiz)\n' +
              '• 3 puan → 1 (Orta)\n' +
              '• 4-5 puan → 2 (Başarılı)\n\n' +
              'Tüm eski verileriniz otomatik olarak yeni sisteme aktarıldı.\n' +
              'Ayarlar sayfasından yeni kuralları yapılandırabilirsiniz.\n\n' +
              'Devam etmek için Tamam\'a tıklayın.'
            )) {
              // Reload page to ensure all components use new data
              window.location.reload();
            }
          }, 1000);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        setLoading(false);
      }
    }

    setupRealtimeSync();

    // Cleanup: Unsubscribe from real-time listeners on unmount
    return () => {
      if (childrenUnsubscribe) {
        console.log('[WSS] Unsubscribing from children updates');
        childrenUnsubscribe();
      }
      if (settingsUnsubscribe) {
        console.log('[WSS] Unsubscribing from settings updates');
        settingsUnsubscribe();
      }
      setIsRealtimeConnected(false);
    };
  }, []);

  // Load unsaved changes from localStorage when date is set
  useEffect(() => {
    if (selectedDate) {
      try {
        const saved = localStorage.getItem(`unsaved_${selectedDate}`);
        if (saved) {
          try {
            setUnsavedChanges(JSON.parse(saved));
          } catch (error) {
            console.error('Failed to parse unsaved changes:', error);
            setUnsavedChanges({});
          }
        } else {
          // Load existing scores for this date
          loadExistingScores(selectedDate);
        }
      } catch (error) {
        console.warn('Failed to read unsaved changes from localStorage:', error);
        // Load existing scores as fallback
        loadExistingScores(selectedDate);
      }
    }
  }, [selectedDate, children]);

  // Save unsaved changes to localStorage whenever they change
  useEffect(() => {
    if (selectedDate && Object.keys(unsavedChanges).length > 0) {
      try {
        localStorage.setItem(`unsaved_${selectedDate}`, JSON.stringify(unsavedChanges));
      } catch (error) {
        console.warn('Failed to save unsaved changes to localStorage:', error);
        // Continue - changes are still in memory and can be saved to Firebase
      }
    }
  }, [unsavedChanges, selectedDate]);

  const loadExistingScores = (date: string) => {
    const changes: UnsavedChanges = {};

    children.forEach(child => {
      const scoreEntry = child.scores?.find(s => s.date === date);
      if (scoreEntry) {
        changes[child.id] = {
          scores: {},
          descriptions: scoreEntry.descriptions || {},
          absent: false
        };

        // Load scores (s1, s2, s3, s4...)
        if (settings) {
          for (let i = 0; i < settings.categories.length; i++) {
            const scoreKey = `s${i + 1}` as keyof typeof scoreEntry;
            if (scoreEntry[scoreKey] !== undefined) {
              changes[child.id].scores[i] = scoreEntry[scoreKey] as number;
            }
          }
        }
      }
    });

    setUnsavedChanges(changes);
  };

  const setEvaluationInfo = (date: string, evaluator: string) => {
    setSelectedDate(date);
    setSelectedEvaluator(evaluator);
  };

  const updateScore = (childId: string, categoryIndex: number, score: number) => {
    setUnsavedChanges(prev => {
      const childChanges = prev[childId] || { scores: {}, descriptions: {}, absent: false };

      // Toggle score if same value clicked
      const newScores = { ...childChanges.scores };
      if (newScores[categoryIndex] === score) {
        delete newScores[categoryIndex];
      } else {
        newScores[categoryIndex] = score;
      }

      return {
        ...prev,
        [childId]: {
          ...childChanges,
          scores: newScores,
          absent: false // Mark as not absent when scoring
        }
      };
    });
  };

  const toggleAbsent = (childId: string) => {
    setUnsavedChanges(prev => {
      const childChanges = prev[childId] || { scores: {}, descriptions: {}, absent: false };
      const newAbsent = !childChanges.absent;

      return {
        ...prev,
        [childId]: {
          scores: newAbsent ? {} : childChanges.scores, // Clear scores if absent
          descriptions: childChanges.descriptions,
          absent: newAbsent
        }
      };
    });
  };

  const updateDescription = (childId: string, categoryIndex: number, description: string) => {
    setUnsavedChanges(prev => {
      const childChanges = prev[childId] || { scores: {}, descriptions: {}, absent: false };
      const newDescriptions = { ...childChanges.descriptions };

      if (description.trim()) {
        newDescriptions[categoryIndex] = description;
      } else {
        delete newDescriptions[categoryIndex];
      }

      return {
        ...prev,
        [childId]: {
          ...childChanges,
          descriptions: newDescriptions
        }
      };
    });
  };

  const quickFillChild = (childId: string, score: number) => {
    if (!settings) return;

    setUnsavedChanges(prev => {
      const childChanges = prev[childId] || { scores: {}, descriptions: {}, absent: false };
      const newScores: { [key: number]: number } = {};

      // Fill all categories with the same score
      for (let i = 0; i < settings.categories.length; i++) {
        newScores[i] = score;
      }

      return {
        ...prev,
        [childId]: {
          ...childChanges,
          scores: newScores,
          absent: false
        }
      };
    });
  };

  const copyLastEvaluation = (childId: string) => {
    if (!settings) return;

    const child = children.find(c => c.id === childId);
    if (!child || !child.scores || child.scores.length === 0) return;

    const lastScore = child.scores[0];

    setUnsavedChanges(prev => {
      const childChanges = prev[childId] || { scores: {}, descriptions: {}, absent: false };
      const newScores: { [key: number]: number } = {};
      const newDescriptions: { [key: number]: string } = {};

      // Copy scores from last evaluation
      for (let i = 0; i < settings.categories.length; i++) {
        const scoreKey = `s${i + 1}` as keyof typeof lastScore;
        if (lastScore[scoreKey] !== undefined) {
          newScores[i] = lastScore[scoreKey] as number;
        }
      }

      // Copy descriptions if any
      if (lastScore.descriptions) {
        Object.assign(newDescriptions, lastScore.descriptions);
      }

      return {
        ...prev,
        [childId]: {
          ...childChanges,
          scores: newScores,
          descriptions: newDescriptions,
          absent: false
        }
      };
    });
  };

  const saveAll = async (isAdmin: boolean): Promise<{ success: boolean; error?: string }> => {
    if (!selectedDate || !selectedEvaluator) {
      return { success: false, error: 'Tarih ve değerlendirici bilgisi eksik!' };
    }

    if (!settings) {
      return { success: false, error: 'Ayarlar yüklenemedi!' };
    }

    // Validate: Check for incomplete entries
    const errors: string[] = [];
    Object.entries(unsavedChanges).forEach(([childId, data]) => {
      if (data.absent) return; // Skip absent children

      const completedCategories = Object.keys(data.scores).length;
      if (completedCategories > 0 && completedCategories < settings.categories.length) {
        const child = children.find(c => c.id === childId);
        if (child) {
          const missingCategories = settings.categories
            .map((cat, i) => data.scores[i] === undefined ? cat : null)
            .filter(Boolean);
          errors.push(`${child.name}: ${missingCategories.join(', ')} eksik!`);
        }
      }
    });

    if (errors.length > 0) {
      return { success: false, error: errors[0] };
    }

    // Check if at least one child has been evaluated
    const hasAnyScores = Object.values(unsavedChanges).some(data =>
      !data.absent && Object.keys(data.scores).length > 0
    );

    if (!hasAnyScores) {
      return { success: false, error: 'Hiçbir değerlendirme yapılmadı!' };
    }

    // IMPORTANT: Check permissions for staff (non-admin)
    // Staff cannot edit existing records!
    if (!isAdmin) {
      const existingScores = children.some(child =>
        child.scores && child.scores.some(s => s.date === selectedDate)
      );

      if (existingScores) {
        return { success: false, error: 'Personel olarak mevcut kayıtları değiştiremezsiniz!' };
      }
    }

    setSaving(true);

    try {
      // Update children with new scores
      const updatedChildren = children.map(child => {
        const changes = unsavedChanges[child.id];
        if (!changes) return child;

        if (changes.absent) {
          // Remove score for this date
          return {
            ...child,
            scores: (child.scores || []).filter(s => s.date !== selectedDate)
          };
        }

        if (Object.keys(changes.scores).length === settings.categories.length) {
          // Create new score entry
          const newEntry: any = {
            date: selectedDate,
            evaluator: selectedEvaluator,
            descriptions: changes.descriptions || {}
          };

          // Add scores (s1, s2, s3, s4...)
          Object.entries(changes.scores).forEach(([catIndex, score]) => {
            newEntry[`s${parseInt(catIndex) + 1}`] = score;
          });

          // Remove old entry for this date and add new one
          const filteredScores = (child.scores || []).filter(s => s.date !== selectedDate);

          return {
            ...child,
            scores: [newEntry, ...filteredScores]
          };
        }

        return child;
      });

      // Save to Firebase
      await saveChildren(updatedChildren);

      // Update local state
      setChildren(updatedChildren);
      setUnsavedChanges({});

      try {
        localStorage.removeItem(`unsaved_${selectedDate}`);
      } catch (error) {
        console.warn('Failed to remove unsaved changes from localStorage:', error);
        // Continue - changes are saved to Firebase, localStorage cleanup is not critical
      }

      return { success: true };
    } catch (error) {
      console.error('Save error:', error);
      return { success: false, error: 'Kayıt başarısız!' };
    } finally {
      setSaving(false);
    }
  };

  const refreshChildren = async () => {
    try {
      const childrenData = await getChildren();
      setChildren(childrenData);
    } catch (error) {
      console.error('Failed to refresh children:', error);
    }
  };

  const hasUnsavedChanges = () => {
    return Object.keys(unsavedChanges).length > 0;
  };

  return (
    <EvaluationContext.Provider
      value={{
        selectedDate,
        selectedEvaluator,
        children,
        settings,
        unsavedChanges,
        loading,
        saving,
        isRealtimeConnected,
        setEvaluationInfo,
        updateScore,
        toggleAbsent,
        updateDescription,
        quickFillChild,
        copyLastEvaluation,
        saveAll,
        refreshChildren,
        hasUnsavedChanges
      }}
    >
      {childrenProp}
    </EvaluationContext.Provider>
  );
}

export function useEvaluation() {
  const context = useContext(EvaluationContext);
  if (context === undefined) {
    throw new Error('useEvaluation must be used within an EvaluationProvider');
  }
  return context;
}
