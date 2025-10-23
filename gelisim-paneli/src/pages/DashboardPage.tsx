import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import DateSelectorModal from '../components/DateSelectorModal';
import EvaluatorSelectorModal from '../components/EvaluatorSelectorModal';
import DarkModeToggle from '../components/DarkModeToggle';

export default function DashboardPage() {
  const { user, isAdmin, signOut } = useAuth();
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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <header className="card p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Dashboard</h1>
              <p className="text-text-muted mt-1">
                {isAdmin ? '🔑 Yönetici' : '👤 Personel'} - {user?.email || 'Anonim'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <DarkModeToggle />
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition"
              >
                Çıkış
              </button>
            </div>
          </div>
        </header>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
          )}
        </div>

        {/* Info Card */}
        <div className="card p-6">
          <h2 className="text-xl font-bold mb-4">Hoş Geldiniz! 👋</h2>
          <p className="text-text-muted mb-4">
            Değerlendirme yapmak için yukarıdaki butonu kullanın.
          </p>

          {/* Status badges */}
          <div className="flex flex-wrap gap-2 mt-4">
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
          </div>
        </div>
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
