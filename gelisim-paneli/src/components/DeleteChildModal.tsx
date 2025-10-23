import ConfirmationModal from './ConfirmationModal';

interface DeleteChildModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  childName: string;
}

export default function DeleteChildModal({ isOpen, onClose, onConfirm, childName }: DeleteChildModalProps) {
  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Çocuğu Sil"
      message={
        <>
          <p>
            <strong className="text-foreground">{childName}</strong> adlı çocuğu silmek istediğinize emin misiniz?
          </p>
          <p className="text-sm text-red-600 dark:text-red-400 mt-3">
            ⚠️ Bu işlem geri alınamaz! Tüm değerlendirmeler silinecek.
          </p>
        </>
      }
      confirmText="Evet, Sil"
      cancelText="İptal"
      variant="danger"
      confirmLoadingText="Siliniyor..."
    />
  );
}
