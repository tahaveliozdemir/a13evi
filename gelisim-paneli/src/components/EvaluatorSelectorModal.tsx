import { useState, useEffect } from 'react';

interface EvaluatorSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  onSubmit: (evaluatorName: string) => void;
  defaultName?: string;
}

export default function EvaluatorSelectorModal({
  isOpen,
  onClose,
  onBack,
  onSubmit,
  defaultName = ''
}: EvaluatorSelectorModalProps) {
  const [evaluatorName, setEvaluatorName] = useState(defaultName);

  useEffect(() => {
    // Load from localStorage
    const savedName = localStorage.getItem('evaluatorName');
    if (savedName) {
      setEvaluatorName(savedName);
    }
  }, []);

  if (!isOpen) return null;

  const handleSubmit = () => {
    const trimmedName = evaluatorName.trim();
    if (!trimmedName) {
      return;
    }

    // Save to localStorage
    localStorage.setItem('evaluatorName', trimmedName);
    onSubmit(trimmedName);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
      onClick={handleBackdropClick}
    >
      <div className="bg-card-bg p-8 rounded-2xl shadow-2xl max-w-md w-full transform transition-all animate-scaleIn">
        <h3 className="text-2xl font-bold text-center mb-6">
          Değerlendirmeyi Kim Yapıyor?
        </h3>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Adınız Soyadınız</label>
          <input
            type="text"
            value={evaluatorName}
            onChange={(e) => setEvaluatorName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Örn: Ahmet Yılmaz"
            className="w-full px-4 py-3 bg-input-bg border border-input-border rounded-lg focus:ring-2 focus:ring-accent transition text-lg"
            autoFocus
          />
          <p className="text-xs text-text-muted mt-2">
            Bu bilgi değerlendirme kayıtlarında görünecektir
          </p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={onBack}
            className="flex-1 bg-gray-500/20 hover:bg-gray-500/30 font-bold py-3 rounded-lg transition"
          >
            Geri
          </button>
          <button
            onClick={handleSubmit}
            disabled={!evaluatorName.trim()}
            className="flex-1 bg-accent hover:bg-accent-hover text-white font-bold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Devam Et
          </button>
        </div>
      </div>
    </div>
  );
}
