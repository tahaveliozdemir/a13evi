import { useAuth } from './contexts/AuthContext';

function App() {
  const { user, loading, isAdmin, signOut } = useAuth();

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
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="card p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                Çocuk Gelişim Takip Paneli
              </h1>
              <p className="text-text-muted mt-1">
                {isAdmin ? '🔑 Yönetici Girişi' : '👤 Personel Girişi'}
              </p>
            </div>
            {isAdmin && (
              <button
                onClick={signOut}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition"
              >
                Çıkış Yap
              </button>
            )}
          </div>
        </header>

        {/* Status Card */}
        <div className="card p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">✅ Kurulum Tamamlandı!</h2>
          <div className="space-y-2 text-sm">
            <p>✓ React + TypeScript + Vite</p>
            <p>✓ Tailwind CSS</p>
            <p>✓ Firebase Entegrasyonu (WebSocket YOK)</p>
            <p>✓ Auth Context</p>
            <p>✓ Servisler (Children, Settings)</p>
          </div>
        </div>

        {/* User Info */}
        <div className="card p-6">
          <h3 className="font-bold mb-3">Kullanıcı Bilgileri:</h3>
          <div className="bg-input-bg p-4 rounded-lg text-sm space-y-1">
            <p><strong>UID:</strong> {user?.uid}</p>
            <p><strong>Email:</strong> {user?.email || 'Anonim'}</p>
            <p><strong>Rol:</strong> {user?.role}</p>
            <p><strong>Anonim:</strong> {user?.isAnonymous ? 'Evet' : 'Hayır'}</p>
          </div>
        </div>

        {/* Next Steps */}
        <div className="mt-8 p-6 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <h3 className="font-bold text-blue-600 dark:text-blue-400 mb-2">
            📋 Sonraki Adımlar:
          </h3>
          <ul className="text-sm space-y-1 text-blue-700 dark:text-blue-300">
            <li>• Giriş sayfası tasarımı</li>
            <li>• Routing yapısı (React Router)</li>
            <li>• Dashboard sayfası</li>
            <li>• Değerlendirme modülü</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;
