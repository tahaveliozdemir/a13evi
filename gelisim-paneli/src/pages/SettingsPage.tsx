import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getSettings, updateSettings } from '../services/settingsService';
import type { AppSettings } from '../types';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'categories' | 'rules' | 'periods'>('categories');

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
  const addCategory = () => {
    if (!settings) return;
    const newCategory = prompt('Yeni kategori adı:');
    if (newCategory && newCategory.trim()) {
      setSettings({
        ...settings,
        categories: [...settings.categories, newCategory.trim()]
      });
    }
  };

  const editCategory = (index: number) => {
    if (!settings) return;
    const newName = prompt('Kategori adını düzenle:', settings.categories[index]);
    if (newName && newName.trim()) {
      const newCategories = [...settings.categories];
      newCategories[index] = newName.trim();
      setSettings({
        ...settings,
        categories: newCategories
      });
    }
  };

  const deleteCategory = (index: number) => {
    if (!settings) return;
    if (settings.categories.length <= 1) {
      showToast('En az bir kategori olmalı!', 'warning');
      return;
    }
    if (confirm(`"${settings.categories[index]}" kategorisini silmek istediğinizden emin misiniz?`)) {
      const newCategories = settings.categories.filter((_, i) => i !== index);
      setSettings({
        ...settings,
        categories: newCategories
      });
    }
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
  const addPeriod = () => {
    if (!settings) return;
    const days = prompt('Kaç günlük periyot?');
    if (!days || isNaN(Number(days))) return;
    const name = prompt('Periyot adı:', `${days} Günlük Kazanım`);
    if (name && name.trim()) {
      setSettings({
        ...settings,
        periods: [...settings.periods, { days: Number(days), name: name.trim() }]
      });
    }
  };

  const editPeriod = (index: number) => {
    if (!settings) return;
    const period = settings.periods[index];
    const days = prompt('Kaç günlük periyot?', String(period.days));
    if (!days || isNaN(Number(days))) return;
    const name = prompt('Periyot adı:', period.name);
    if (name && name.trim()) {
      const newPeriods = [...settings.periods];
      newPeriods[index] = { days: Number(days), name: name.trim() };
      setSettings({
        ...settings,
        periods: newPeriods
      });
    }
  };

  const deletePeriod = (index: number) => {
    if (!settings) return;
    if (confirm(`"${settings.periods[index].name}" periyodunu silmek istediğinizden emin misiniz?`)) {
      const newPeriods = settings.periods.filter((_, i) => i !== index);
      setSettings({
        ...settings,
        periods: newPeriods
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-text-muted">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Ayarlar</h1>
              <p className="text-text-muted mt-1">Uygulama yapılandırmasını yönetin</p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-gray-500/20 hover:bg-gray-500/30 px-4 py-2 rounded-lg font-medium transition"
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
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
                activeTab === 'categories'
                  ? 'bg-accent text-white'
                  : 'bg-transparent hover:bg-gray-500/10'
              }`}
            >
              Kategoriler
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
                activeTab === 'rules'
                  ? 'bg-accent text-white'
                  : 'bg-transparent hover:bg-gray-500/10'
              }`}
            >
              Kurallar
            </button>
            <button
              onClick={() => setActiveTab('periods')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
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
                onClick={addCategory}
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
                    onClick={() => editCategory(index)}
                    className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg font-medium transition"
                  >
                    Düzenle
                  </button>
                  <button
                    onClick={() => deleteCategory(index)}
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
            <h2 className="text-2xl font-bold mb-6">Değerlendirme Kuralları</h2>

            <div className="space-y-6">
              {/* Calculation Type */}
              <div className="p-4 bg-input-bg rounded-lg border border-input-border">
                <label className="block text-sm font-medium mb-2">Hesaplama Tipi</label>
                <select
                  value={settings.calcType}
                  onChange={(e) => setSettings({ ...settings, calcType: e.target.value as 'neutral' | 'normal' })}
                  className="w-full px-4 py-2 bg-background border border-input-border rounded-lg focus:ring-2 focus:ring-accent transition"
                >
                  <option value="neutral">Nötr Ortalama (Veto kuralı ile)</option>
                  <option value="normal">Normal Ortalama</option>
                </select>
                <p className="text-sm text-text-muted mt-2">
                  Nötr ortalamada belirli sayıda 5 puan, belirli sayıda 1 puanı iptal eder.
                </p>
              </div>

              {/* Threshold */}
              <div className="p-4 bg-input-bg rounded-lg border border-input-border">
                <label className="block text-sm font-medium mb-2">Başarı Eşiği</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="5"
                  value={settings.threshold}
                  onChange={(e) => setSettings({ ...settings, threshold: Number(e.target.value) })}
                  className="w-full px-4 py-2 bg-background border border-input-border rounded-lg focus:ring-2 focus:ring-accent transition"
                />
                <p className="text-sm text-text-muted mt-2">
                  Bu değerin üzerinde ortalamaya sahip çocuklar başarılı sayılır.
                </p>
              </div>

              {/* Veto Rules (only for neutral) */}
              {settings.calcType === 'neutral' && (
                <>
                  <div className="p-4 bg-input-bg rounded-lg border border-input-border">
                    <label className="block text-sm font-medium mb-2">Veto Kuralı - 5 Puan Sayısı</label>
                    <input
                      type="number"
                      min="1"
                      value={settings.vetoFives}
                      onChange={(e) => setSettings({ ...settings, vetoFives: Number(e.target.value) })}
                      className="w-full px-4 py-2 bg-background border border-input-border rounded-lg focus:ring-2 focus:ring-accent transition"
                    />
                    <p className="text-sm text-text-muted mt-2">
                      Kaç tane 5 puan, belirtilen sayıda 1 puanı iptal eder.
                    </p>
                  </div>

                  <div className="p-4 bg-input-bg rounded-lg border border-input-border">
                    <label className="block text-sm font-medium mb-2">Veto Kuralı - 1 Puan Sayısı</label>
                    <input
                      type="number"
                      min="1"
                      value={settings.vetoOnes}
                      onChange={(e) => setSettings({ ...settings, vetoOnes: Number(e.target.value) })}
                      className="w-full px-4 py-2 bg-background border border-input-border rounded-lg focus:ring-2 focus:ring-accent transition"
                    />
                    <p className="text-sm text-text-muted mt-2">
                      Belirtilen sayıda 5 puan, kaç tane 1 puanı iptal eder.
                    </p>
                  </div>

                  <div className="p-4 bg-input-bg rounded-lg border border-input-border">
                    <label className="block text-sm font-medium mb-2">İptal Eşiği</label>
                    <input
                      type="number"
                      min="0"
                      value={settings.cancelThreshold}
                      onChange={(e) => setSettings({ ...settings, cancelThreshold: Number(e.target.value) })}
                      className="w-full px-4 py-2 bg-background border border-input-border rounded-lg focus:ring-2 focus:ring-accent transition"
                    />
                    <p className="text-sm text-text-muted mt-2">
                      Veto kuralı uygulandıktan sonraki iptal eşiği.
                    </p>
                  </div>
                </>
              )}

              {/* Example Calculation */}
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <h3 className="font-bold mb-2 text-blue-600 dark:text-blue-400">Örnek:</h3>
                <p className="text-sm text-text-muted">
                  {settings.calcType === 'neutral'
                    ? `${settings.vetoFives} tane 5 puan, ${settings.vetoOnes} tane 1 puanı iptal eder. Örneğin: [5,5,1,3] → İptal → [3] → Ortalama: 3.0`
                    : 'Normal ortalama: Tüm puanların aritmetik ortalaması. Örneğin: [5,5,1,3] → Ortalama: 3.5'}
                </p>
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
                onClick={addPeriod}
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
                    onClick={() => editPeriod(index)}
                    className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg font-medium transition"
                  >
                    Düzenle
                  </button>
                  <button
                    onClick={() => deletePeriod(index)}
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
      </div>
    </div>
  );
}
