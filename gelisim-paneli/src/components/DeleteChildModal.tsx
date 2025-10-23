import { useState } from 'react';

interface DeleteChildModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  childName: string;
}

export default function DeleteChildModal({ isOpen, onClose, onConfirm, childName }: DeleteChildModalProps) {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
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
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold mb-2">Çocuğu Sil</h3>
          <p className="text-text-muted">
            <strong className="text-foreground">{childName}</strong> adlı çocuğu silmek istediğinize emin misiniz?
          </p>
          <p className="text-sm text-red-600 dark:text-red-400 mt-3">
            ⚠️ Bu işlem geri alınamaz! Tüm değerlendirmeler silinecek.
          </p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 bg-gray-500/20 hover:bg-gray-500/30 font-bold py-3 rounded-lg transition disabled:opacity-50"
          >
            İptal
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Siliniyor...' : 'Evet, Sil'}
          </button>
        </div>
      </div>
    </div>
  );
}
