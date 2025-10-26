import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import DarkModeToggle from '../components/DarkModeToggle';

export default function LoginPage() {
  const { isAdmin, signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isStaffLogin, setIsStaffLogin] = useState(true);

  // If already logged in as admin, redirect to dashboard
  if (isAdmin) {
    navigate('/dashboard');
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError('E-posta veya şifre hatalı');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStaffLogin = () => {
    // Staff is already logged in anonymously
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-yaban-darkest flex flex-col items-center justify-center p-4 font-display">
      {/* Dark Mode Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <DarkModeToggle />
      </div>

      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="mb-8 flex justify-center">
          <div className="flex items-center justify-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yaban-dark text-yaban-lightest">
              <span className="material-symbols-outlined text-3xl">
                psychology
              </span>
            </div>
            <span className="text-2xl font-bold text-yaban-lightest">Gelişim Paneli</span>
          </div>
        </div>

        {/* Welcome Text */}
        <div className="text-center">
          <h1 className="text-yaban-lightest tracking-tight text-[32px] font-bold leading-tight">
            {isStaffLogin ? 'Hoş Geldiniz' : 'Yönetici Girişi'}
          </h1>
          <p className="text-yaban-light text-base font-normal leading-normal pt-2">
            {isStaffLogin ? 'Gelişim Paneli hesabınıza giriş yapın' : 'Yönetici hesabınıza giriş yapın'}
          </p>
        </div>

        {/* Login Form */}
        <div className="mt-8">
          {isStaffLogin ? (
            /* Staff Login */
            <div className="flex flex-col gap-4">
              <button
                onClick={handleStaffLogin}
                className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-yaban-mid text-yaban-lightest text-base font-bold leading-normal tracking-[0.015em] hover:bg-yaban-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yaban-mid focus:ring-offset-yaban-darkest transition-colors duration-200"
              >
                <span className="truncate">Personel Girişi</span>
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-yaban-mid"></div>
                <span className="text-sm text-yaban-light">veya</span>
                <div className="flex-1 h-px bg-yaban-mid"></div>
              </div>

              <button
                onClick={() => setIsStaffLogin(false)}
                className="text-sm font-medium text-yaban-lightest hover:text-yaban-light focus:outline-none focus:ring-2 focus:ring-yaban-mid rounded-sm text-center"
              >
                Yönetici olarak giriş yap
              </button>
            </div>
          ) : (
            /* Admin Login Form */
            <form onSubmit={handleAdminLogin} className="flex flex-col gap-4">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="flex flex-col">
                <label className="text-yaban-lightest text-base font-medium leading-normal pb-2" htmlFor="email">
                  E-posta Adresi
                </label>
                <input
                  className="form-input flex w-full resize-none overflow-hidden rounded-lg text-yaban-lightest focus:outline-0 focus:ring-2 focus:ring-yaban-mid border border-yaban-mid bg-yaban-dark h-14 placeholder:text-yaban-light p-[15px] text-base font-normal leading-normal"
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="E-postanızı girin"
                  required
                />
              </div>

              <div className="flex flex-col">
                <label className="text-yaban-lightest text-base font-medium leading-normal pb-2" htmlFor="password">
                  Şifre
                </label>
                <div className="relative flex w-full items-stretch">
                  <input
                    className="form-input flex w-full resize-none overflow-hidden rounded-lg text-yaban-lightest focus:outline-0 focus:ring-2 focus:ring-yaban-mid border border-yaban-mid bg-yaban-dark h-14 placeholder:text-yaban-light p-[15px] text-base font-normal leading-normal pr-12"
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Şifrenizi girin"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-yaban-light hover:text-yaban-lightest transition-colors"
                  >
                    <span className="material-symbols-outlined">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  className="text-sm font-medium text-yaban-lightest hover:text-yaban-light focus:outline-none focus:ring-2 focus:ring-yaban-mid rounded-sm"
                >
                  Şifrenizi mi unuttunuz?
                </button>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-yaban-mid text-yaban-lightest text-base font-bold leading-normal tracking-[0.015em] hover:bg-yaban-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yaban-mid focus:ring-offset-yaban-darkest transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="truncate">{loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsStaffLogin(true)}
                className="text-sm font-medium text-yaban-lightest hover:text-yaban-light focus:outline-none focus:ring-2 focus:ring-yaban-mid rounded-sm text-center"
              >
                ← Personel girişine dön
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-yaban-light">
            Yardıma mı ihtiyacınız var?{' '}
            <a
              href="#"
              className="font-medium text-yaban-lightest hover:text-yaban-light focus:outline-none focus:ring-2 focus:ring-yaban-mid rounded-sm"
            >
              Destek ile İletişime Geçin
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
