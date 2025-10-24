import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getSettings, updateSettings } from '../services/settingsService';
import LoadingSpinner from '../components/LoadingSpinner';
import InputModal from '../components/InputModal';
import ConfirmationModal from '../components/ConfirmationModal';
import type { AppSettings } from '../types';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'categories' | 'rules' | 'periods'>('categories');

  // Modal states
  const [categoryModal, setCategoryModal] = useState<{
    isOpen: boolean;
    mode: 'add' | 'edit';
    index?: number;
    initialValue?: string;
  }>({ isOpen: false, mode: 'add' });

  const [periodDaysModal, setPeriodDaysModal] = useState<{
    isOpen: boolean;
    mode: 'add' | 'edit';
    index?: number;
    initialDays?: number;
  }>({ isOpen: false, mode: 'add' });

  const [periodNameModal, setPeriodNameModal] = useState<{
    isOpen: boolean;
    days: number;
    index?: number;
    initialName?: string;
  }>({ isOpen: false, days: 0 });

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: 'category' | 'period';
    index: number;
    name: string;
  }>({ isOpen: false, type: 'category', index: 0, name: '' });

  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
    }
  }, [isAdmin, navigate]);

  // Load settings
  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await getSettings();
        setSettings(data);
      } catch (error) {
        showToast('Ayarlar yüklenirken hata oluştu!', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, [showToast]);

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      await updateSettings(settings);
      showToast('Ayarlar başarıyla kaydedildi!', 'success');
    } catch (error) {
      showToast('Ayarlar kaydedilirken hata oluştu!', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Category Management
  const handleCategorySubmit = (value: string) => {
    if (!settings) return;

    if (categoryModal.mode === 'add') {
      setSettings({
        ...settings,
        categories: [...settings.categories, value]
      });
      showToast('Kategori eklendi!', 'success');
    } else if (categoryModal.index !== undefined) {
      const newCategories = [...settings.categories];
      newCategories[categoryModal.index] = value;
      setSettings({
        ...settings,
        categories: newCategories
      });
      showToast('Kategori güncellendi!', 'success');
    }
  };

  const handleDeleteCategory = () => {
    if (!settings || deleteModal.type !== 'category') return;

    if (settings.categories.length <= 1) {
      showToast('En az bir kategori olmalı!', 'warning');
      return;
    }

    const newCategories = settings.categories.filter((_, i) => i !== deleteModal.index);
    setSettings({
      ...settings,
      categories: newCategories
    });
    showToast('Kategori silindi!', 'success');
  };

  const moveCategoryUp = (index: number) => {
    if (!settings || index === 0) return;
    const newCategories = [...settings.categories];
    [newCategories[index - 1], newCategories[index]] = [newCategories[index], newCategories[index - 1]];
    setSettings({
      ...settings,
      categories: newCategories
    });
  };

  const moveCategoryDown = (index: number) => {
    if (!settings || index === settings.categories.length - 1) return;
    const newCategories = [...settings.categories];
    [newCategories[index], newCategories[index + 1]] = [newCategories[index + 1], newCategories[index]];
    setSettings({
      ...settings,
      categories: newCategories
    });
  };

  // Period Management
  const handlePeriodDaysSubmit = (value: string) => {
    const days = parseInt(value, 10);

    if (periodDaysModal.mode === 'add') {
      // Open name modal with the days
      setPeriodNameModal({
        isOpen: true,
        days,
        initialName: `${days} Günlük Kazanım`
      });
    } else if (periodDaysModal.index !== undefined) {
      // For edit, open name modal with existing period name
      const period = settings?.periods[periodDaysModal.index];
      setPeriodNameModal({
        isOpen: true,
        days,
        index: periodDaysModal.index,
        initialName: period?.name
      });
    }
  };

  const handlePeriodNameSubmit = (name: string) => {
    if (!settings) return;

    if (periodNameModal.index !== undefined) {
      // Edit mode
      const newPeriods = [...settings.periods];
      newPeriods[periodNameModal.index] = { days: periodNameModal.days, name };
      setSettings({
        ...settings,
        periods: newPeriods
      });
      showToast('Periyot güncellendi!', 'success');
    } else {
      // Add mode
      setSettings({
        ...settings,
        periods: [...settings.periods, { days: periodNameModal.days, name }]
      });
      showToast('Periyot eklendi!', 'success');
    }
  };

  const handleDeletePeriod = () => {
    if (!settings || deleteModal.type !== 'period') return;

    const newPeriods = settings.periods.filter((_, i) => i !== deleteModal.index);
    setSettings({
      ...settings,
      periods: newPeriods
    });
    showToast('Periyot silindi!', 'success');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!settings) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="card p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Ayarlar</h1>
              <p className="text-text-muted mt-1 text-sm sm:text-base">Uygulama yapılandırmasını yönetin</p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-gray-500/20 hover:bg-gray-500/30 px-4 py-2 rounded-lg font-medium transition w-full sm:w-auto"
            >
              Geri Dön
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="card p-2 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('categories')}
              className={`flex-1 py-3 px-2 sm:px-4 rounded-lg font-medium text-sm sm:text-base transition ${
                activeTab === 'categories'
                  ? 'bg-accent text-white'
                  : 'bg-transparent hover:bg-gray-500/10'
              }`}
            >
              Kategoriler
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className={`flex-1 py-3 px-2 sm:px-4 rounded-lg font-medium text-sm sm:text-base transition ${
                activeTab === 'rules'
                  ? 'bg-accent text-white'
                  : 'bg-transparent hover:bg-gray-500/10'
              }`}
            >
              Kurallar
            </button>
            <button
              onClick={() => setActiveTab('periods')}
              className={`flex-1 py-3 px-2 sm:px-4 rounded-lg font-medium text-sm sm:text-base transition ${
                activeTab === 'periods'
                  ? 'bg-accent text-white'
                  : 'bg-transparent hover:bg-gray-500/10'
              }`}
            >
              Periyotlar
            </button>
          </div>
        </div>

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Değerlendirme Kategorileri</h2>
              <button
                onClick={() => setCategoryModal({ isOpen: true, mode: 'add' })}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Kategori Ekle
              </button>
            </div>

            <div className="space-y-3">
              {settings.categories.map((category, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-4 bg-input-bg rounded-lg border border-input-border"
                >
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => moveCategoryUp(index)}
                      disabled={index === 0}
                      className="text-text-muted hover:text-accent disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <polyline points="18 15 12 9 6 15" />
                      </svg>
                    </button>
                    <button
                      onClick={() => moveCategoryDown(index)}
                      disabled={index === settings.categories.length - 1}
                      className="text-text-muted hover:text-accent disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-lg">{category}</span>
                      <span className="text-sm text-text-muted">#{index + 1}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setCategoryModal({ isOpen: true, mode: 'edit', index, initialValue: category })}
                    className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg font-medium transition"
                  >
                    Düzenle
                  </button>
                  <button
                    onClick={() => setDeleteModal({ isOpen: true, type: 'category', index, name: category })}
                    className="bg-red-500/20 hover:bg-red-500/30 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-lg font-medium transition"
                  >
                    Sil
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rules Tab */}
        {activeTab === 'rules' && (
          <div className="card p-6">
            <h2 className="text-2xl font-bold mb-6">Değerlendirme Kuralları (0-1-2 Sistemi)</h2>

            <div className="space-y-6">
              {/* Scoring System Info */}
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <h3 className="font-bold mb-2 text-blue-600 dark:text-blue-400">Puanlama Sistemi:</h3>
                <div className="space-y-1 text-sm">
                  <p><strong>2</strong> = Başarılı (Yeşil)</p>
                  <p><strong>1</strong> = Orta (Sarı)</p>
                  <p><strong>0</strong> = Yetersiz (Kırmızı)</p>
                </div>
              </div>

              {/* Threshold */}
              <div className="p-4 bg-input-bg rounded-lg border border-input-border">
                <label className="block text-sm font-medium mb-3">
                  Kazanım Eşiği: <strong className="text-accent">{settings.threshold.toFixed(2)}</strong>
                </label>
                <input
                  type="range"
                  step="0.1"
                  min="0"
                  max="2"
                  value={settings.threshold}
                  onChange={(e) => setSettings({ ...settings, threshold: Number(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-text-muted mt-1">
                  <span>0.0</span>
                  <span>1.0</span>
                  <span>2.0</span>
                </div>
                <p className="text-sm text-text-muted mt-2">
                  Bu değerin üzerinde ortalamaya sahip çocuklar kazanım elde etmiş sayılır.
                </p>
              </div>

              {/* Veto Rule */}
              <div className="p-4 bg-input-bg rounded-lg border border-input-border">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium">Veto Kuralı</label>
                  <button
                    onClick={() => setSettings({
                      ...settings,
                      vetoRule: { ...settings.vetoRule, enabled: !settings.vetoRule.enabled }
                    })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                      settings.vetoRule.enabled ? 'bg-accent' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        settings.vetoRule.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {settings.vetoRule.enabled && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-text-muted mb-1">
                        Kaç tane 0 varsa ödül alamaz?
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={settings.vetoRule.zeroCount}
                        onChange={(e) => setSettings({
                          ...settings,
                          vetoRule: { ...settings.vetoRule, zeroCount: Number(e.target.value) }
                        })}
                        className="w-full px-3 py-2 bg-background border border-input-border rounded-lg focus:ring-2 focus:ring-accent transition text-sm"
                      />
                    </div>
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs">
                      <strong>Örnek:</strong> {settings.vetoRule.zeroCount} veya daha fazla 0 varsa, ortalama ne olursa olsun kazanım sağlanamaz.
                      <br />
                      <span className="text-text-muted">[2, 2, 1, 0, 0, 0] → Veto! Ortalama hesaplanır ama kazanım yok.</span>
                    </div>
                  </div>
                )}

                {!settings.vetoRule.enabled && (
                  <p className="text-xs text-text-muted">
                    Veto kuralı kapalı. Tüm puanlar ortala hesaba dahil edilir.
                  </p>
                )}
              </div>

              {/* Cancel Rule */}
              <div className="p-4 bg-input-bg rounded-lg border border-input-border">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium">İptal Kuralı</label>
                  <button
                    onClick={() => setSettings({
                      ...settings,
                      cancelRule: { ...settings.cancelRule, enabled: !settings.cancelRule.enabled }
                    })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                      settings.cancelRule.enabled ? 'bg-accent' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        settings.cancelRule.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {settings.cancelRule.enabled && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-text-muted mb-1">
                          Kaç tane {settings.cancelRule.highScore}
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={settings.cancelRule.highCount}
                          onChange={(e) => setSettings({
                            ...settings,
                            cancelRule: { ...settings.cancelRule, highCount: Number(e.target.value) }
                          })}
                          className="w-full px-3 py-2 bg-background border border-input-border rounded-lg focus:ring-2 focus:ring-accent transition text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-text-muted mb-1">
                          Kaç tane {settings.cancelRule.lowScore}'ı iptal eder
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={settings.cancelRule.lowCount}
                          onChange={(e) => setSettings({
                            ...settings,
                            cancelRule: { ...settings.cancelRule, lowCount: Number(e.target.value) }
                          })}
                          className="w-full px-3 py-2 bg-background border border-input-border rounded-lg focus:ring-2 focus:ring-accent transition text-sm"
                        />
                      </div>
                    </div>
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded text-xs">
                      <strong>Örnek:</strong> {settings.cancelRule.highCount} tane {settings.cancelRule.highScore}, {settings.cancelRule.lowCount} tane {settings.cancelRule.lowScore}'ı iptal eder.
                      <br />
                      <span className="text-text-muted">
                        [2, 2, 1, 0] → İptal → [1] (2'ler ve 0 kaldırıldı) → Ortalama: 1.0
                      </span>
                    </div>
                  </div>
                )}

                {!settings.cancelRule.enabled && (
                  <p className="text-xs text-text-muted">
                    İptal kuralı kapalı. Puanlar birbirini iptal etmez.
                  </p>
                )}
              </div>

              {/* Live Example */}
              <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <h3 className="font-bold mb-2 text-purple-600 dark:text-purple-400">Canlı Örnek:</h3>
                <div className="text-sm space-y-2">
                  <p>Puanlar: <code className="bg-black/20 px-2 py-1 rounded">[2, 2, 1, 1, 0, 0]</code></p>
                  {settings.cancelRule.enabled && (
                    <p className="text-text-muted">
                      İptal sonrası: <code className="bg-black/20 px-2 py-1 rounded">
                        [{Array(6 - settings.cancelRule.highCount - settings.cancelRule.lowCount).fill('1').join(', ')}]
                      </code>
                    </p>
                  )}
                  <p>
                    Ortalama: <strong className="text-accent">
                      {(() => {
                        let scores = [2, 2, 1, 1, 0, 0];
                        if (settings.cancelRule.enabled) {
                          scores = scores.slice(settings.cancelRule.highCount + settings.cancelRule.lowCount);
                        }
                        const avg = scores.length > 0 ? scores.reduce((a,b)=>a+b,0)/scores.length : 0;
                        const hasVeto = settings.vetoRule.enabled && scores.filter(s=>s===0).length >= settings.vetoRule.zeroCount;
                        return hasVeto ? `${avg.toFixed(2)} ⚠ VETO` : avg.toFixed(2);
                      })()}
                    </strong>
                  </p>
                  <p>
                    Sonuç: {(() => {
                      let scores = [2, 2, 1, 1, 0, 0];
                      if (settings.cancelRule.enabled) {
                        scores = scores.slice(settings.cancelRule.highCount + settings.cancelRule.lowCount);
                      }
                      const avg = scores.length > 0 ? scores.reduce((a,b)=>a+b,0)/scores.length : 0;
                      const hasVeto = settings.vetoRule.enabled && scores.filter(s=>s===0).length >= settings.vetoRule.zeroCount;
                      if (hasVeto) return <span className="text-red-500 font-bold">Kazanım YOK (Veto)</span>;
                      return avg >= settings.threshold
                        ? <span className="text-emerald-500 font-bold">Kazanım VAR ✓</span>
                        : <span className="text-red-500 font-bold">Kazanım YOK ✗</span>;
                    })()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Periods Tab */}
        {activeTab === 'periods' && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Kazanım Periyotları</h2>
              <button
                onClick={() => setPeriodDaysModal({ isOpen: true, mode: 'add' })}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Periyot Ekle
              </button>
            </div>

            <div className="space-y-3">
              {settings.periods.map((period, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-4 bg-input-bg rounded-lg border border-input-border"
                >
                  <div className="flex-1">
                    <div className="font-medium text-lg">{period.name}</div>
                    <div className="text-sm text-text-muted">{period.days} gün</div>
                  </div>

                  <button
                    onClick={() => setPeriodDaysModal({ isOpen: true, mode: 'edit', index, initialDays: period.days })}
                    className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg font-medium transition"
                  >
                    Düzenle
                  </button>
                  <button
                    onClick={() => setDeleteModal({ isOpen: true, type: 'period', index, name: period.name })}
                    className="bg-red-500/20 hover:bg-red-500/30 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-lg font-medium transition"
                  >
                    Sil
                  </button>
                </div>
              ))}

              {settings.periods.length === 0 && (
                <div className="text-center py-8 text-text-muted">
                  Henüz periyot eklenmedi. Yukarıdaki butona tıklayarak ekleyebilirsiniz.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="fixed bottom-8 right-8">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 px-8 rounded-lg shadow-2xl transition flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Kaydediliyor...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="m9 12 2 2 4-4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
                Ayarları Kaydet
              </>
            )}
          </button>
        </div>

        {/* Modals */}
        <InputModal
          isOpen={categoryModal.isOpen}
          onClose={() => setCategoryModal({ isOpen: false, mode: 'add' })}
          onConfirm={handleCategorySubmit}
          title={categoryModal.mode === 'add' ? 'Yeni Kategori Ekle' : 'Kategori Düzenle'}
          placeholder="Kategori adı"
          initialValue={categoryModal.initialValue}
          validate={(value) => {
            if (settings?.categories.includes(value) &&
                (categoryModal.mode === 'add' ||
                 (categoryModal.index !== undefined && settings.categories[categoryModal.index] !== value))) {
              return 'Bu kategori zaten mevcut';
            }
            if (value.length < 2) {
              return 'Kategori adı en az 2 karakter olmalı';
            }
            return null;
          }}
          maxLength={50}
        />

        <InputModal
          isOpen={periodDaysModal.isOpen}
          onClose={() => setPeriodDaysModal({ isOpen: false, mode: 'add' })}
          onConfirm={handlePeriodDaysSubmit}
          title="Periyot Gün Sayısı"
          placeholder="Örn: 30"
          initialValue={periodDaysModal.initialDays?.toString()}
          type="number"
          validate={(value) => {
            const days = parseInt(value, 10);
            if (isNaN(days) || days < 1 || days > 365) {
              return 'Lütfen 1-365 arasında bir gün sayısı girin';
            }
            return null;
          }}
        />

        <InputModal
          isOpen={periodNameModal.isOpen}
          onClose={() => setPeriodNameModal({ isOpen: false, days: 0 })}
          onConfirm={handlePeriodNameSubmit}
          title="Periyot Adı"
          placeholder="Örn: 30 Günlük Kazanım"
          initialValue={periodNameModal.initialName}
          maxLength={50}
        />

        <ConfirmationModal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false, type: 'category', index: 0, name: '' })}
          onConfirm={deleteModal.type === 'category' ? handleDeleteCategory : handleDeletePeriod}
          title={deleteModal.type === 'category' ? 'Kategori Sil' : 'Periyot Sil'}
          message={`"${deleteModal.name}" ${deleteModal.type === 'category' ? 'kategorisini' : 'periyodunu'} silmek istediğinizden emin misiniz?`}
          variant="danger"
          confirmText="Evet, Sil"
        />
      </div>
    </div>
  );
}
