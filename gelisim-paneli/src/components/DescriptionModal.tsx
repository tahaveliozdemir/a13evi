import { useState, useEffect } from 'react';

interface DescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (description: string) => void;
  title: string;
  initialValue?: string;
}

export default function DescriptionModal({
  isOpen,
  onClose,
  onSave,
  title,
  initialValue = ''
}: DescriptionModalProps) {
  const [description, setDescription] = useState(initialValue);

  useEffect(() => {
    setDescription(initialValue);
  }, [initialValue, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(description);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4 animate-fadeIn"
      onClick={handleBackdropClick}
    >
      <div className="bg-card-bg p-8 rounded-2xl shadow-2xl max-w-lg w-full transform transition-all animate-scaleIn">
        <h3 className="text-xl font-bold text-center mb-6">{title}</h3>

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={handleKeyPress}
          rows={5}
          placeholder="Not ekleyin (opsiyonel)..."
          className="w-full p-3 bg-input-bg border border-input-border rounded-lg focus:ring-2 focus:ring-accent transition text-sm mb-6 resize-none"
          autoFocus
        />

        <p className="text-xs text-text-muted mb-6">
          💡 İpucu: Ctrl+Enter ile hızlı kaydet
        </p>

        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-500/20 hover:bg-gray-500/30 font-bold py-3 rounded-lg transition"
          >
            İptal
          </button>
          <button
            onClick={handleSave}
            className="flex-1 bg-accent hover:bg-accent-hover text-white font-bold py-3 rounded-lg transition"
          >
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}
