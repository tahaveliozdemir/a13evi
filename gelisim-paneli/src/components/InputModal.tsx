import { useState, useEffect, useRef } from 'react';

interface InputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value: string) => void;
  title: string;
  placeholder?: string;
  initialValue?: string;
  confirmText?: string;
  cancelText?: string;
  validate?: (value: string) => string | null; // Returns error message or null
  maxLength?: number;
  type?: 'text' | 'number';
}

export default function InputModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  placeholder = '',
  initialValue = '',
  confirmText = 'Onayla',
  cancelText = 'İptal',
  validate,
  maxLength = 100,
  type = 'text'
}: InputModalProps) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setValue(initialValue);
      setError(null);
      // Focus input after modal opens
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, initialValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedValue = value.trim();

    // Basic validation
    if (!trimmedValue) {
      setError('Bu alan boş bırakılamaz');
      return;
    }

    // Custom validation
    if (validate) {
      const validationError = validate(trimmedValue);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    onConfirm(trimmedValue);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fadeIn"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="input-modal-title"
    >
      <div className="bg-card-bg p-8 rounded-2xl shadow-2xl max-w-md w-full transform transition-all animate-scaleIn">
        <h3 id="input-modal-title" className="text-2xl font-bold mb-6">
          {title}
        </h3>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <input
              ref={inputRef}
              type={type}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError(null);
              }}
              placeholder={placeholder}
              maxLength={maxLength}
              className={`w-full px-4 py-3 bg-input-bg border rounded-lg focus:ring-2 focus:ring-accent transition ${
                error ? 'border-red-500' : 'border-input-border'
              }`}
              aria-invalid={!!error}
              aria-describedby={error ? 'input-error' : undefined}
            />
            {error && (
              <p id="input-error" className="mt-2 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
            {maxLength && (
              <p className="mt-1 text-xs text-text-muted text-right">
                {value.length}/{maxLength}
              </p>
            )}
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-500/20 hover:bg-gray-500/30 font-bold py-3 rounded-lg transition"
            >
              {cancelText}
            </button>
            <button
              type="submit"
              className="flex-1 bg-accent hover:bg-accent-hover text-white font-bold py-3 rounded-lg transition"
            >
              {confirmText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
