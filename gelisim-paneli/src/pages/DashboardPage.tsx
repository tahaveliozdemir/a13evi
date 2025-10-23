import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEvaluation } from '../contexts/EvaluationContext';
import DateSelectorModal from '../components/DateSelectorModal';
import EvaluatorSelectorModal from '../components/EvaluatorSelectorModal';
import DarkModeToggle from '../components/DarkModeToggle';
import LoadingSpinner from '../components/LoadingSpinner';
import { calculateChildStats } from '../utils/calculations';
import type { Child } from '../types';

export default function DashboardPage() {
  const { user, isAdmin, signOut } = useAuth();
  const { children, settings, loading } = useEvaluation();
  const navigate = useNavigate();

  const [showDateModal, setShowDateModal] = useState(false);
  const [showEvaluatorModal, setShowEvaluatorModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');

  const handleStartEvaluation = () => {
    setShowDateModal(true);
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setShowDateModal(false);
    setShowEvaluatorModal(true);
  };

  const handleEvaluatorSubmit = (evaluatorName: string) => {
    setShowEvaluatorModal(false);
    // Navigate to evaluation page with date and evaluator
    navigate('/evaluation', {
      state: {
        date: selectedDate,
        evaluator: evaluatorName
      }
    });
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  // Calculate statistics
  const stats = {
    totalChildren: children.length,
    totalEvaluations: children.reduce((sum, child) => sum + (child.scores?.length || 0), 0),
    averageScore: 0,
    successRate: 0,
    recentEvaluations: [] as { childName: string; date: string; evaluator: string; avg: number }[]
  };

  if (settings && children.length > 0) {
    // Calculate average score across all children
    const childrenStats = children.map(child => calculateChildStats(child, settings));
    const totalAvg = childrenStats.reduce((sum, s) => sum + (s.neutralAvg?.average || 0), 0);
    stats.averageScore = childrenStats.length > 0 ? totalAvg / childrenStats.length : 0;

    // Calculate success rate (above threshold)
    const successfulChildren = childrenStats.filter(s => (s.neutralAvg?.average || 0) >= settings.threshold);
    stats.successRate = childrenStats.length > 0 ? (successfulChildren.length / childrenStats.length) * 100 : 0;

    // Get recent evaluations (last 7 days)
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    children.forEach(child => {
      if (child.scores) {
        child.scores.forEach(score => {
          const scoreDate = new Date(score.date);
          if (scoreDate >= sevenDaysAgo) {
            const childStats = calculateChildStats(child, settings);
            stats.recentEvaluations.push({
              childName: child.name,
              date: score.date,
              evaluator: score.evaluator,
              avg: childStats.neutralAvg?.average || 0
            });
          }
        });
      }
    });

    // Sort by date descending
    stats.recentEvaluations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    stats.recentEvaluations = stats.recentEvaluations.slice(0, 5); // Top 5 recent
  }

  // Top performers
  const topPerformers: { child: Child; avg: number }[] = [];
  if (settings && children.length > 0) {
    children.forEach(child => {
      const childStats = calculateChildStats(child, settings);
      if (childStats.neutralAvg !== null) {
        topPerformers.push({ child, avg: childStats.neutralAvg.average });
      }
    });
    topPerformers.sort((a, b) => b.avg - a.avg);
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <header className="card p-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Dashboard</h1>
              <p className="text-text-muted mt-1 text-sm sm:text-base">
                {isAdmin ? '🔑 Yönetici' : '👤 Personel'} - {user?.email || 'Anonim'}
              </p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <DarkModeToggle />
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition flex-1 sm:flex-none"
              >
                Çıkış
              </button>
            </div>
          </div>
        </header>

        {/* Quick Actions */}
        <div className={`grid grid-cols-1 ${isAdmin ? 'md:grid-cols-3' : 'md:grid-cols-1'} gap-6 mb-8`}>
          <button
            onClick={handleStartEvaluation}
            className="card p-8 hover:shadow-xl transition-all transform hover:scale-105 text-left"
          >
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-emerald-500 rounded-xl flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold">Değerlendirme Yap</h3>
                <p className="text-text-muted text-sm">Günlük değerlendirme başlat</p>
              </div>
            </div>
          </button>

          {isAdmin && (
            <>
              <button
                onClick={() => navigate('/stats')}
                className="card p-8 hover:shadow-xl transition-all transform hover:scale-105 text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 bg-purple-500 rounded-xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">İstatistikler</h3>
                    <p className="text-text-muted text-sm">Grafikler ve analiz</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => navigate('/settings')}
                className="card p-8 hover:shadow-xl transition-all transform hover:scale-105 text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 bg-blue-500 rounded-xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Ayarlar</h3>
                    <p className="text-text-muted text-sm">Kategoriler ve kurallar</p>
                  </div>
                </div>
              </button>
            </>
          )}
        </div>

        {/* Statistics Cards */}
        {loading ? (
          <div className="py-12">
            <LoadingSpinner message="İstatistikler yükleniyor..." fullScreen={false} />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
              {/* Total Children */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-text-muted text-sm font-medium">Toplam Çocuk</span>
                  <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="text-2xl sm:text-3xl font-bold">{stats.totalChildren}</div>
                <p className="text-text-muted text-xs mt-1">Kayıtlı çocuk sayısı</p>
              </div>

              {/* Total Evaluations */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-text-muted text-sm font-medium">Toplam Değerlendirme</span>
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="text-2xl sm:text-3xl font-bold">{stats.totalEvaluations}</div>
                <p className="text-text-muted text-xs mt-1">Tüm kayıtlar</p>
              </div>

              {/* Average Score */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-text-muted text-sm font-medium">Genel Ortalama</span>
                  <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="text-2xl sm:text-3xl font-bold">{stats.averageScore.toFixed(2)}</div>
                <p className="text-text-muted text-xs mt-1">Tüm çocuklar ortalaması</p>
              </div>

              {/* Success Rate */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-text-muted text-sm font-medium">Başarı Oranı</span>
                  <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <div className="text-2xl sm:text-3xl font-bold">{stats.successRate.toFixed(0)}%</div>
                <p className="text-text-muted text-xs mt-1">Eşik üstü çocuklar</p>
              </div>
            </div>

            {/* Two Column Layout for Recent & Top */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Recent Evaluations */}
              <div className="card p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Son Değerlendirmeler
                </h2>
                {stats.recentEvaluations.length === 0 ? (
                  <p className="text-text-muted text-center py-8">Henüz değerlendirme yok</p>
                ) : (
                  <div className="space-y-3">
                    {stats.recentEvaluations.map((evaluation, index) => (
                      <div key={index} className="p-3 bg-input-bg rounded-lg border border-input-border">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium">{evaluation.childName}</div>
                            <div className="text-sm text-text-muted">
                              {new Date(evaluation.date).toLocaleDateString('tr-TR')} • {evaluation.evaluator}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-lg font-bold ${
                              evaluation.avg >= (settings?.threshold || 3.25) ? 'text-emerald-500' : 'text-amber-500'
                            }`}>
                              {evaluation.avg.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top Performers */}
              <div className="card p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  En Başarılılar
                </h2>
                {topPerformers.length === 0 ? (
                  <p className="text-text-muted text-center py-8">Henüz veri yok</p>
                ) : (
                  <div className="space-y-3">
                    {topPerformers.slice(0, 5).map((performer, index) => (
                      <div key={performer.child.id} className="p-3 bg-input-bg rounded-lg border border-input-border">
                        <div className="flex items-center gap-3">
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                            index === 0 ? 'bg-amber-500 text-white' :
                            index === 1 ? 'bg-gray-400 text-white' :
                            index === 2 ? 'bg-orange-600 text-white' :
                            'bg-blue-500/20 text-blue-600'
                          }`}>
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{performer.child.name}</div>
                            <div className="text-xs text-text-muted">
                              {performer.child.scores?.length || 0} değerlendirme
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-emerald-500">
                              {performer.avg.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Info Card */}
            <div className="card p-6">
              <h2 className="text-xl font-bold mb-4">Sistem Durumu</h2>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-sm font-medium">
                  ✓ Firebase Bağlı
                </span>
                <span className="px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium">
                  ✓ WebSocket Kapalı
                </span>
                {isAdmin && (
                  <span className="px-3 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full text-sm font-medium">
                    ✓ Admin Erişimi
                  </span>
                )}
                {settings && (
                  <span className="px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full text-sm font-medium">
                    ✓ {settings.categories.length} Kategori
                  </span>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <DateSelectorModal
        isOpen={showDateModal}
        onClose={() => setShowDateModal(false)}
        onSelect={handleDateSelect}
      />

      <EvaluatorSelectorModal
        isOpen={showEvaluatorModal}
        onClose={() => setShowEvaluatorModal(false)}
        onBack={() => {
          setShowEvaluatorModal(false);
          setShowDateModal(true);
        }}
        onSubmit={handleEvaluatorSubmit}
      />
    </div>
  );
}
