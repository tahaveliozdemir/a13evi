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
    const childrenStats = children.map(child => calculateChildStats(child, settings));
    const totalAvg = childrenStats.reduce((sum, s) => sum + (s.average ?? 0), 0);
    stats.averageScore = childrenStats.length > 0 ? totalAvg / childrenStats.length : 0;

    const successfulChildren = childrenStats.filter(s => (s.average ?? 0) >= settings.threshold);
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
              avg: childStats.average ?? 0
            });
          }
        });
      }
    });

    stats.recentEvaluations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    stats.recentEvaluations = stats.recentEvaluations.slice(0, 5);
  }

  // Top performers
  const topPerformers: { child: Child; avg: number }[] = [];
  if (settings && children.length > 0) {
    children.forEach(child => {
      const childStats = calculateChildStats(child, settings);
      if (childStats.average !== null && childStats.average !== undefined) {
        topPerformers.push({ child, avg: childStats.average });
      }
    });
    topPerformers.sort((a, b) => b.avg - a.avg);
  }

  return (
    <div className="relative w-full min-h-screen flex flex-col pb-24 bg-background-light dark:bg-background-dark font-display">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center bg-background-light dark:bg-background-dark p-4 justify-between border-b border-border-light dark:border-border-dark shadow-sm">
        <h1 className="text-text-light-primary dark:text-text-dark-primary text-xl font-bold">
          Gelişim Paneli
        </h1>
        <div className="flex items-center gap-2">
          <DarkModeToggle />
          <button
            onClick={handleLogout}
            className="flex items-center justify-center h-10 w-10 text-text-light-primary dark:text-text-dark-primary hover:bg-card-light dark:hover:bg-card-dark rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-2xl">logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col gap-6 p-4">
        {loading ? (
          <div className="py-12">
            <LoadingSpinner message="İstatistikler yükleniyor..." fullScreen={false} />
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col gap-2 rounded-xl p-4 bg-card-light dark:bg-card-dark shadow-sm border border-border-light dark:border-border-dark">
                <span className="material-symbols-outlined text-primary text-2xl">groups</span>
                <p className="text-text-light-secondary dark:text-text-dark-secondary text-sm font-medium">
                  Toplam Çocuk
                </p>
                <p className="text-text-light-primary dark:text-text-dark-primary text-2xl font-bold">
                  {stats.totalChildren}
                </p>
              </div>

              <div className="flex flex-col gap-2 rounded-xl p-4 bg-card-light dark:bg-card-dark shadow-sm border border-border-light dark:border-border-dark">
                <span className="material-symbols-outlined text-primary text-2xl">checklist</span>
                <p className="text-text-light-secondary dark:text-text-dark-secondary text-sm font-medium">
                  Değerlendirme
                </p>
                <p className="text-text-light-primary dark:text-text-dark-primary text-2xl font-bold">
                  {stats.totalEvaluations}
                </p>
              </div>

              <div className="flex flex-col gap-2 rounded-xl p-4 bg-card-light dark:bg-card-dark shadow-sm border border-border-light dark:border-border-dark">
                <span className="material-symbols-outlined text-primary text-2xl">star</span>
                <p className="text-text-light-secondary dark:text-text-dark-secondary text-sm font-medium">
                  Ortalama Puan
                </p>
                <p className="text-text-light-primary dark:text-text-dark-primary text-2xl font-bold">
                  {stats.averageScore.toFixed(2)}
                </p>
              </div>

              <div className="flex flex-col gap-2 rounded-xl p-4 bg-card-light dark:bg-card-dark shadow-sm border border-border-light dark:border-border-dark">
                <span className="material-symbols-outlined text-primary text-2xl">trending_up</span>
                <p className="text-text-light-secondary dark:text-text-dark-secondary text-sm font-medium">
                  Başarı Oranı
                </p>
                <p className="text-text-light-primary dark:text-text-dark-primary text-2xl font-bold">
                  {stats.successRate.toFixed(0)}%
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={handleStartEvaluation}
                className="flex items-center gap-4 bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-xl p-6 shadow-sm hover:shadow-md transition-all"
              >
                <div className="h-14 w-14 bg-primary/20 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-3xl">edit_note</span>
                </div>
                <div className="text-left">
                  <h3 className="text-text-light-primary dark:text-text-dark-primary text-lg font-bold">
                    Değerlendirme Yap
                  </h3>
                  <p className="text-text-light-secondary dark:text-text-dark-secondary text-sm">
                    Yeni değerlendirme başlat
                  </p>
                </div>
              </button>

              {isAdmin && (
                <>
                  <button
                    onClick={() => navigate('/stats')}
                    className="flex items-center gap-4 bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-xl p-6 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="h-14 w-14 bg-primary/20 rounded-xl flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-3xl">bar_chart</span>
                    </div>
                    <div className="text-left">
                      <h3 className="text-text-light-primary dark:text-text-dark-primary text-lg font-bold">
                        İstatistikler
                      </h3>
                      <p className="text-text-light-secondary dark:text-text-dark-secondary text-sm">
                        Grafikler ve analiz
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => navigate('/settings')}
                    className="flex items-center gap-4 bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-xl p-6 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="h-14 w-14 bg-primary/20 rounded-xl flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-3xl">settings</span>
                    </div>
                    <div className="text-left">
                      <h3 className="text-text-light-primary dark:text-text-dark-primary text-lg font-bold">
                        Ayarlar
                      </h3>
                      <p className="text-text-light-secondary dark:text-text-dark-secondary text-sm">
                        Kategoriler ve kurallar
                      </p>
                    </div>
                  </button>
                </>
              )}
            </div>

            {/* Recent Evaluations & Top Performers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Evaluations */}
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <h2 className="text-text-light-primary dark:text-text-dark-primary text-lg font-bold">
                    Son Değerlendirmeler
                  </h2>
                  <button className="text-primary text-sm font-semibold hover:text-primary/80">
                    Tümünü Gör
                  </button>
                </div>
                <div className="flex flex-col bg-card-light dark:bg-card-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark divide-y divide-border-light dark:divide-border-dark">
                  {stats.recentEvaluations.length === 0 ? (
                    <div className="p-8 text-center text-text-light-secondary dark:text-text-dark-secondary">
                      Henüz değerlendirme yok
                    </div>
                  ) : (
                    stats.recentEvaluations.map((evaluation, index) => (
                      <div key={index} className="flex items-center gap-4 p-4 min-h-[72px] justify-between">
                        <div className="flex-1">
                          <p className="text-text-light-primary dark:text-text-dark-primary text-base font-medium">
                            {evaluation.childName}
                          </p>
                          <p className="text-text-light-secondary dark:text-text-dark-secondary text-sm">
                            {new Date(evaluation.date).toLocaleDateString('tr-TR')} • {evaluation.evaluator}
                          </p>
                        </div>
                        <p className={`text-base font-semibold ${
                          evaluation.avg >= (settings?.threshold || 1.5) ? 'text-primary' : 'text-text-light-secondary dark:text-text-dark-secondary'
                        }`}>
                          {evaluation.avg.toFixed(2)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Top Performers */}
              <div className="flex flex-col gap-3">
                <h2 className="text-text-light-primary dark:text-text-dark-primary text-lg font-bold">
                  En Başarılılar
                </h2>
                <div className="flex flex-col bg-card-light dark:bg-card-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark divide-y divide-border-light dark:divide-border-dark">
                  {topPerformers.length === 0 ? (
                    <div className="p-8 text-center text-text-light-secondary dark:text-text-dark-secondary">
                      Henüz veri yok
                    </div>
                  ) : (
                    topPerformers.slice(0, 5).map((performer, index) => (
                      <div key={performer.child.id} className="flex items-center gap-4 p-4 min-h-[72px] justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            index === 0 ? 'bg-amber-500 text-white' :
                            index === 1 ? 'bg-gray-400 text-white' :
                            index === 2 ? 'bg-orange-600 text-white' :
                            'bg-primary/20 text-primary'
                          }`}>
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="text-text-light-primary dark:text-text-dark-primary text-base font-medium">
                              {performer.child.name}
                            </p>
                            <p className="text-text-light-secondary dark:text-text-dark-secondary text-sm">
                              {performer.child.scores?.length || 0} değerlendirme
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 font-semibold text-primary">
                          <span className="material-symbols-outlined text-base">emoji_events</span>
                          <p className="text-base">{performer.avg.toFixed(2)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Floating Action Button */}
      <button
        onClick={handleStartEvaluation}
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform hover:scale-105 active:scale-95 md:hidden"
      >
        <span className="material-symbols-outlined text-3xl">add</span>
      </button>

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
