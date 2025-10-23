import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEvaluation } from '../contexts/EvaluationContext';
import { useToast } from '../contexts/ToastContext';
import { calculateChildStats } from '../utils/calculations';
import { exportToExcel, exportToPDF, exportDetailedExcel, exportDetailedPDF } from '../utils/export';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function StatsPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { children, settings, loading } = useEvaluation();
  const { showToast } = useToast();
  const [selectedChild, setSelectedChild] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | '7days' | '30days' | '90days'>('all');
  const [performanceFilter, setPerformanceFilter] = useState<'all' | 'above' | 'below'>('all');
  const [showArchived, setShowArchived] = useState(false);

  // Redirect if not admin
  if (!isAdmin && !loading) {
    navigate('/dashboard');
    return null;
  }

  // Filter children based on filters
  const filteredChildren = useMemo(() => {
    if (!settings) return [];

    let filtered = children;

    // Filter by archived status
    if (!showArchived) {
      filtered = filtered.filter(child => !child.archived);
    }

    // Filter by date
    if (dateFilter !== 'all') {
      const now = new Date();
      let daysAgo: number;
      switch (dateFilter) {
        case '7days': daysAgo = 7; break;
        case '30days': daysAgo = 30; break;
        case '90days': daysAgo = 90; break;
        default: daysAgo = 0;
      }
      const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

      filtered = filtered.filter(child => {
        if (!child.scores || child.scores.length === 0) return false;
        const lastScoreDate = new Date(child.scores[0].date);
        return lastScoreDate >= cutoffDate;
      });
    }

    // Filter by performance
    if (performanceFilter !== 'all') {
      filtered = filtered.filter(child => {
        const stats = calculateChildStats(child, settings);
        if (stats.neutralAvg === null) return false;
        const isAboveThreshold = stats.neutralAvg.average >= settings.threshold;
        return performanceFilter === 'above' ? isAboveThreshold : !isAboveThreshold;
      });
    }

    return filtered;
  }, [children, settings, showArchived, dateFilter, performanceFilter]);

  // Export handlers
  const handleExportExcel = async () => {
    if (!settings) return;
    try {
      if (selectedChild === 'all') {
        await exportToExcel(children, settings);
        showToast('Excel raporu indirildi!', 'success');
      } else {
        const child = children.find(c => c.id === selectedChild);
        if (child) {
          await exportDetailedExcel(child, settings);
          showToast(`${child.name} için Excel raporu indirildi!`, 'success');
        }
      }
    } catch (error) {
      showToast('Excel dışa aktarma başarısız!', 'error');
    }
  };

  const handleExportPDF = () => {
    if (!settings) return;
    try {
      if (selectedChild === 'all') {
        exportToPDF(children, settings);
        showToast('PDF raporu indirildi!', 'success');
      } else {
        const child = children.find(c => c.id === selectedChild);
        if (child) {
          exportDetailedPDF(child, settings);
          showToast(`${child.name} için PDF raporu indirildi!`, 'success');
        }
      }
    } catch (error) {
      showToast('PDF dışa aktarma başarısız!', 'error');
    }
  };

  // Calculate trend data (last 30 days)
  const trendData = useMemo(() => {
    if (!settings || children.length === 0) return [];

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const dateMap = new Map<string, { totalScore: number; count: number }>();

    // Filter by selected child or use all
    const targetChildren = selectedChild === 'all'
      ? children
      : children.filter(c => c.id === selectedChild);

    targetChildren.forEach(child => {
      if (child.scores) {
        child.scores.forEach(score => {
          const scoreDate = new Date(score.date);
          if (scoreDate >= thirtyDaysAgo) {
            const dateKey = score.date;
            if (!dateMap.has(dateKey)) {
              dateMap.set(dateKey, { totalScore: 0, count: 0 });
            }
            const stats = calculateChildStats(child, settings);
            if (stats.neutralAvg !== null) {
              const entry = dateMap.get(dateKey)!;
              entry.totalScore += stats.neutralAvg.average;
              entry.count += 1;
            }
          }
        });
      }
    });

    // Convert to array and sort by date
    const data = Array.from(dateMap.entries())
      .map(([date, { totalScore, count }]) => ({
        date: new Date(date).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' }),
        average: count > 0 ? totalScore / count : 0
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-14); // Last 14 days

    return data;
  }, [children, settings, selectedChild]);

  // Category averages
  const categoryData = useMemo(() => {
    if (!settings || children.length === 0) return [];

    const categoryTotals: number[] = Array(settings.categories.length).fill(0);
    const categoryCounts: number[] = Array(settings.categories.length).fill(0);

    const targetChildren = selectedChild === 'all'
      ? children
      : children.filter(c => c.id === selectedChild);

    targetChildren.forEach(child => {
      if (child.scores) {
        child.scores.forEach(score => {
          for (let i = 0; i < settings.categories.length; i++) {
            const scoreKey = `s${i + 1}` as keyof typeof score;
            const scoreValue = score[scoreKey];
            if (typeof scoreValue === 'number') {
              categoryTotals[i] += scoreValue;
              categoryCounts[i] += 1;
            }
          }
        });
      }
    });

    return settings.categories.map((name, index) => ({
      name: name.length > 15 ? name.substring(0, 15) + '...' : name,
      average: categoryCounts[index] > 0 ? categoryTotals[index] / categoryCounts[index] : 0
    }));
  }, [children, settings, selectedChild]);

  // Score distribution
  const distributionData = useMemo(() => {
    if (!settings || children.length === 0) return [];

    const ranges = [
      { name: '4.5-5.0', min: 4.5, max: 5.0, count: 0, color: '#10b981' },
      { name: '4.0-4.4', min: 4.0, max: 4.5, count: 0, color: '#84cc16' },
      { name: '3.5-3.9', min: 3.5, max: 4.0, count: 0, color: '#eab308' },
      { name: '3.0-3.4', min: 3.0, max: 3.5, count: 0, color: '#f59e0b' },
      { name: '2.5-2.9', min: 2.5, max: 3.0, count: 0, color: '#f97316' },
      { name: '0.0-2.4', min: 0.0, max: 2.5, count: 0, color: '#ef4444' }
    ];

    const targetChildren = selectedChild === 'all'
      ? children
      : children.filter(c => c.id === selectedChild);

    targetChildren.forEach(child => {
      const stats = calculateChildStats(child, settings);
      if (stats.neutralAvg !== null) {
        const avg = stats.neutralAvg.average;
        const range = ranges.find(r => avg >= r.min && avg < r.max);
        if (range) range.count++;
      }
    });

    return ranges.filter(r => r.count > 0);
  }, [children, settings, selectedChild]);

  // Achievement stats
  const achievementData = useMemo(() => {
    if (!settings || children.length === 0) return [];

    const targetChildren = selectedChild === 'all'
      ? children
      : children.filter(c => c.id === selectedChild);

    return settings.periods.map((period, periodIndex) => {
      let achieved = 0;
      let total = 0;

      targetChildren.forEach(child => {
        const stats = calculateChildStats(child, settings);
        const periodStat = stats.periods[periodIndex];
        if (periodStat) {
          total++;
          if (periodStat.achieved) achieved++;
        }
      });

      return {
        name: period.name,
        achieved,
        notAchieved: total - achieved,
        percentage: total > 0 ? ((achieved / total) * 100).toFixed(0) : '0'
      };
    });
  }, [children, settings, selectedChild]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="card p-6 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Grafikler ve Trendler</h1>
              <p className="text-text-muted mt-1 text-sm sm:text-base">Detaylı analiz ve görselleştirme</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
              <button
                onClick={handleExportExcel}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 sm:px-4 py-2 rounded-lg font-medium text-sm sm:text-base transition flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Excel
              </button>
              <button
                onClick={handleExportPDF}
                className="bg-red-500 hover:bg-red-600 text-white px-3 sm:px-4 py-2 rounded-lg font-medium text-sm sm:text-base transition flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                PDF
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-gray-500/20 hover:bg-gray-500/30 px-3 sm:px-4 py-2 rounded-lg font-medium text-sm sm:text-base transition"
              >
                Geri Dön
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Gelişmiş Filtreler
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Child Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Çocuk</label>
              <select
                value={selectedChild}
                onChange={(e) => setSelectedChild(e.target.value)}
                className="w-full px-4 py-2 bg-input-bg border border-input-border rounded-lg focus:ring-2 focus:ring-accent transition"
              >
                <option value="all">Tüm Çocuklar</option>
                {filteredChildren.map(child => (
                  <option key={child.id} value={child.id}>{child.name}</option>
                ))}
              </select>
            </div>

            {/* Date Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Tarih Aralığı</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="w-full px-4 py-2 bg-input-bg border border-input-border rounded-lg focus:ring-2 focus:ring-accent transition"
              >
                <option value="all">Tüm Zamanlar</option>
                <option value="7days">Son 7 Gün</option>
                <option value="30days">Son 30 Gün</option>
                <option value="90days">Son 90 Gün</option>
              </select>
            </div>

            {/* Performance Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Performans</label>
              <select
                value={performanceFilter}
                onChange={(e) => setPerformanceFilter(e.target.value as any)}
                className="w-full px-4 py-2 bg-input-bg border border-input-border rounded-lg focus:ring-2 focus:ring-accent transition"
              >
                <option value="all">Tümü</option>
                <option value="above">Eşik Üstü</option>
                <option value="below">Eşik Altı</option>
              </select>
            </div>

            {/* Archived Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Arşiv</label>
              <button
                onClick={() => setShowArchived(!showArchived)}
                className={`w-full px-4 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                  showArchived
                    ? 'bg-accent text-white'
                    : 'bg-input-bg border border-input-border hover:bg-gray-500/10'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                {showArchived ? 'Gösteriliyor' : 'Gizli'}
              </button>
            </div>
          </div>

          {/* Active Filters Summary */}
          {(dateFilter !== 'all' || performanceFilter !== 'all' || showArchived) && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-sm text-text-muted">Aktif Filtreler:</span>
              {dateFilter !== 'all' && (
                <span className="px-3 py-1 bg-accent/10 text-accent rounded-full text-sm flex items-center gap-1">
                  {dateFilter === '7days' ? 'Son 7 Gün' : dateFilter === '30days' ? 'Son 30 Gün' : 'Son 90 Gün'}
                  <button onClick={() => setDateFilter('all')} className="hover:text-accent-hover">×</button>
                </span>
              )}
              {performanceFilter !== 'all' && (
                <span className="px-3 py-1 bg-accent/10 text-accent rounded-full text-sm flex items-center gap-1">
                  {performanceFilter === 'above' ? 'Eşik Üstü' : 'Eşik Altı'}
                  <button onClick={() => setPerformanceFilter('all')} className="hover:text-accent-hover">×</button>
                </span>
              )}
              {showArchived && (
                <span className="px-3 py-1 bg-accent/10 text-accent rounded-full text-sm flex items-center gap-1">
                  Arşiv Gösteriliyor
                  <button onClick={() => setShowArchived(false)} className="hover:text-accent-hover">×</button>
                </span>
              )}
            </div>
          )}
        </div>

        {children.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-text-muted text-lg">Henüz veri yok. Değerlendirme yaparak başlayın.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Trend Line Chart */}
            <div className="card p-6">
              <h2 className="text-xl font-bold mb-4">Performans Trendi (Son 14 Gün)</h2>
              {trendData.length === 0 ? (
                <p className="text-text-muted text-center py-12">Bu filtre için yeterli veri yok</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9ca3af" />
                    <YAxis domain={[0, 5]} stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card-bg)',
                        border: '1px solid var(--input-border)',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="average"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ fill: '#10b981', r: 5 }}
                      name="Ortalama Puan"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Category Bar Chart */}
            <div className="card p-6">
              <h2 className="text-xl font-bold mb-4">Kategori Bazlı Ortalamalar</h2>
              {categoryData.length === 0 ? (
                <p className="text-text-muted text-center py-12">Kategori verisi yok</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9ca3af" />
                    <YAxis domain={[0, 5]} stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card-bg)',
                        border: '1px solid var(--input-border)',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="average" fill="#3b82f6" name="Ortalama" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Distribution Pie Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card p-6">
                <h2 className="text-xl font-bold mb-4">Puan Dağılımı</h2>
                {distributionData.length === 0 ? (
                  <p className="text-text-muted text-center py-12">Dağılım verisi yok</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={distributionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, count }) => `${name}: ${count}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {distributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--card-bg)',
                          border: '1px solid var(--input-border)',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Achievement Stats */}
              <div className="card p-6">
                <h2 className="text-xl font-bold mb-4">Kazanım İstatistikleri</h2>
                {achievementData.length === 0 ? (
                  <p className="text-text-muted text-center py-12">Kazanım verisi yok</p>
                ) : (
                  <div className="space-y-4">
                    {achievementData.map((achievement, index) => (
                      <div key={index} className="p-4 bg-input-bg rounded-lg border border-input-border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{achievement.name}</span>
                          <span className="text-lg font-bold text-emerald-500">
                            {achievement.percentage}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-3 rounded-full transition-all"
                            style={{ width: `${achievement.percentage}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between mt-2 text-sm text-text-muted">
                          <span>✓ Başarılı: {achievement.achieved}</span>
                          <span>✗ Devam: {achievement.notAchieved}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Summary Stats */}
            <div className="card p-6">
              <h2 className="text-xl font-bold mb-4">Özet İstatistikler</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/30">
                  <div className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-1">
                    Toplam Çocuk
                  </div>
                  <div className="text-3xl font-bold">
                    {selectedChild === 'all' ? children.length : 1}
                  </div>
                </div>
                <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
                  <div className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">
                    Toplam Değerlendirme
                  </div>
                  <div className="text-3xl font-bold">
                    {(selectedChild === 'all'
                      ? children
                      : children.filter(c => c.id === selectedChild)
                    ).reduce((sum, c) => sum + (c.scores?.length || 0), 0)}
                  </div>
                </div>
                <div className="p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
                  <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mb-1">
                    Genel Ortalama
                  </div>
                  <div className="text-3xl font-bold">
                    {(() => {
                      const targetChildren = selectedChild === 'all'
                        ? children
                        : children.filter(c => c.id === selectedChild);
                      if (!settings || targetChildren.length === 0) return '0.00';
                      const childrenStats = targetChildren.map(child => calculateChildStats(child, settings));
                      const totalAvg = childrenStats.reduce((sum, s) => sum + (s.neutralAvg?.average || 0), 0);
                      return (childrenStats.length > 0 ? totalAvg / childrenStats.length : 0).toFixed(2);
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
