import { useState } from 'react';

interface DateSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (date: string) => void;
}

export default function DateSelectorModal({ isOpen, onClose, onSelect }: DateSelectorModalProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!selectedDate) return;
    onSelect(selectedDate);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
      onClick={handleBackdropClick}
    >
      <div className="bg-card-bg p-8 rounded-2xl shadow-2xl max-w-md w-full transform transition-all animate-scaleIn">
        <h3 className="text-2xl font-bold text-center mb-6">
          Hangi Tarihi Değerlendireceksiniz?
        </h3>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Tarih Seçin</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-3 bg-input-bg border border-input-border rounded-lg focus:ring-2 focus:ring-accent transition text-lg"
          />
        </div>

        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-500/20 hover:bg-gray-500/30 font-bold py-3 rounded-lg transition"
          >
            İptal
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedDate}
            className="flex-1 bg-accent hover:bg-accent-hover text-white font-bold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            İleri
          </button>
        </div>
      </div>
    </div>
  );
}
