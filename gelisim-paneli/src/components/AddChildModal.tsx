import { useState } from 'react';

interface AddChildModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string) => Promise<void>;
}

export default function AddChildModal({ isOpen, onClose, onAdd }: AddChildModalProps) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('İsim boş olamaz');
      return;
    }

    if (trimmedName.length < 2) {
      setError('İsim en az 2 karakter olmalı');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onAdd(trimmedName);
      setName('');
      onClose();
    } catch (err) {
      setError('Çocuk eklenirken hata oluştu');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fadeIn"
      onClick={handleBackdropClick}
    >
      <div className="bg-card-bg p-8 rounded-2xl shadow-2xl max-w-md w-full transform transition-all animate-scaleIn">
        <h3 className="text-2xl font-bold text-center mb-6">Yeni Çocuk Ekle</h3>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Çocuk Adı Soyadı</label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder="Örn: Ahmet Yılmaz"
              className="w-full px-4 py-3 bg-input-bg border border-input-border rounded-lg focus:ring-2 focus:ring-accent transition text-lg"
              autoFocus
              disabled={loading}
            />
            {error && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-gray-500/20 hover:bg-gray-500/30 font-bold py-3 rounded-lg transition disabled:opacity-50"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 bg-accent hover:bg-accent-hover text-white font-bold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Ekleniyor...' : 'Ekle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
