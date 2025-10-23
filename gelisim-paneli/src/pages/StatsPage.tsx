import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEvaluation } from '../contexts/EvaluationContext';
import { calculateChildStats } from '../utils/calculations';
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
  const [selectedChild, setSelectedChild] = useState<string>('all');

  // Redirect if not admin
  if (!isAdmin && !loading) {
    navigate('/dashboard');
    return null;
  }

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
              entry.totalScore += stats.neutralAvg;
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
        const range = ranges.find(r => stats.neutralAvg! >= r.min && stats.neutralAvg! < r.max);
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

    return settings.periods.map(period => {
      let achieved = 0;
      let total = 0;

      targetChildren.forEach(child => {
        const stats = calculateChildStats(child, settings);
        const periodStat = stats.periods.find(p => p.days === period.days);
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-text-muted">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Grafikler ve Trendler</h1>
              <p className="text-text-muted mt-1">Detaylı analiz ve görselleştirme</p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-gray-500/20 hover:bg-gray-500/30 px-4 py-2 rounded-lg font-medium transition"
            >
              Geri Dön
            </button>
          </div>
        </div>

        {/* Child Filter */}
        <div className="card p-4 mb-6">
          <label className="block text-sm font-medium mb-2">Çocuk Seç (Filtreleme)</label>
          <select
            value={selectedChild}
            onChange={(e) => setSelectedChild(e.target.value)}
            className="w-full md:w-96 px-4 py-2 bg-input-bg border border-input-border rounded-lg focus:ring-2 focus:ring-accent transition"
          >
            <option value="all">Tüm Çocuklar</option>
            {children.map(child => (
              <option key={child.id} value={child.id}>{child.name}</option>
            ))}
          </select>
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
                      const totalAvg = childrenStats.reduce((sum, s) => sum + (s.neutralAvg || 0), 0);
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
