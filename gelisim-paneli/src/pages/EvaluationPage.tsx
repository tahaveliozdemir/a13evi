import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEvaluation } from '../contexts/EvaluationContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { formatDate } from '../utils/calculations';
import { addChild, deleteChild, archiveChild, unarchiveChild } from '../services/childrenService';
import ChildCardV2 from '../components/ChildCardV2';
import DescriptionModal from '../components/DescriptionModal';
import AddChildModal from '../components/AddChildModal';
import DeleteChildModal from '../components/DeleteChildModal';
import LoadingSpinner from '../components/LoadingSpinner';

export default function EvaluationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const {
    selectedDate,
    selectedEvaluator,
    children,
    settings,
    unsavedChanges,
    loading,
    saving,
    setEvaluationInfo,
    updateScore,
    toggleAbsent,
    updateDescription,
    quickFillChild,
    copyLastEvaluation,
    saveAll,
    refreshChildren,
    hasUnsavedChanges
  } = useEvaluation();

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('az');
  const [showArchived, setShowArchived] = useState(false);
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    childId: string | null;
    childName: string;
  }>({
    isOpen: false,
    childId: null,
    childName: ''
  });
  const [descriptionModal, setDescriptionModal] = useState<{
    isOpen: boolean;
    childId: string | null;
    childName: string;
    categoryIndex: number | null;
    categoryName: string;
  }>({
    isOpen: false,
    childId: null,
    childName: '',
    categoryIndex: null,
    categoryName: ''
  });

  // Get date and evaluator from navigation state
  useEffect(() => {
    const state = location.state as { date?: string; evaluator?: string } | null;
    if (state?.date && state?.evaluator) {
      setEvaluationInfo(state.date, state.evaluator);
    } else if (!selectedDate || !selectedEvaluator) {
      // Redirect back if no evaluation info
      navigate('/dashboard');
    }
  }, [location.state, selectedDate, selectedEvaluator, setEvaluationInfo, navigate]);

  const handleSave = async () => {
    const result = await saveAll(isAdmin);
    if (result.success) {
      showToast('Tüm değişiklikler kaydedildi!', 'success');
      // Optionally navigate back to dashboard
      // navigate('/dashboard');
    } else {
      showToast(result.error || 'Kayıt başarısız!', 'error');
    }
  };

  const handleChangeDate = () => {
    if (hasUnsavedChanges()) {
      if (!confirm('Kaydedilmemiş değişiklikler var! Devam etmek istiyor musunuz?')) {
        return;
      }
    }
    navigate('/dashboard');
  };

  const handleAddChild = async (name: string) => {
    try {
      await addChild(name);
      await refreshChildren();
      showToast(`${name} başarıyla eklendi!`, 'success');
    } catch (error) {
      showToast('Çocuk eklenirken hata oluştu!', 'error');
      throw error;
    }
  };

  const handleDeleteChild = async () => {
    if (!deleteModal.childId) return;

    try {
      await deleteChild(deleteModal.childId);
      await refreshChildren();
      showToast(`${deleteModal.childName} silindi!`, 'success');
    } catch (error) {
      showToast('Çocuk silinirken hata oluştu!', 'error');
      throw error;
    }
  };

  const handleArchiveChild = async (childId: string, childName: string) => {
    try {
      await archiveChild(childId);
      await refreshChildren();
      showToast(`${childName} arşivlendi!`, 'success');
    } catch (error) {
      showToast('Arşivleme sırasında hata oluştu!', 'error');
      console.error(error);
    }
  };

  const handleUnarchiveChild = async (childId: string, childName: string) => {
    try {
      await unarchiveChild(childId);
      await refreshChildren();
      showToast(`${childName} arşivden çıkarıldı!`, 'success');
    } catch (error) {
      showToast('Arşivden çıkarma sırasında hata oluştu!', 'error');
      console.error(error);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!selectedDate || !selectedEvaluator || !settings) {
    return null;
  }

  // Filter and sort children
  const filteredChildren = children
    .filter(child => {
      // Filter by search term
      const matchesSearch = child.name.toLowerCase().includes(searchTerm.toLowerCase());
      // Filter by archived status
      const matchesArchived = showArchived ? true : !child.archived;
      return matchesSearch && matchesArchived;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'za':
          return b.name.localeCompare(a.name);
        case 'az':
        default:
          return a.name.localeCompare(b.name);
      }
    });

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-display">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header with Date & Evaluator Info */}
        <div className="bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-xl p-4 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">Tarih</p>
                <p className="font-bold text-lg text-text-light-primary dark:text-text-dark-primary">{formatDate(selectedDate)}</p>
              </div>
              <div className="h-10 w-px bg-border-light dark:bg-border-dark"></div>
              <div>
                <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">Değerlendiren</p>
                <p className="font-bold text-lg text-text-light-primary dark:text-text-dark-primary">{selectedEvaluator}</p>
              </div>
            </div>
            <button
              onClick={handleChangeDate}
              className="bg-yaban-mid/20 hover:bg-yaban-mid/30 border border-yaban-mid px-4 py-2 rounded-lg font-medium transition text-text-light-primary dark:text-text-dark-primary"
            >
              Tarih/İsim Değiştir
            </button>
          </div>
        </div>

        {/* Add Child Button (Admin Only) */}
        {isAdmin && (
          <div className="mb-6">
            <button
              onClick={() => setShowAddChildModal(true)}
              className="w-full md:w-auto bg-primary hover:bg-primary/80 text-white font-bold py-3 px-6 rounded-lg shadow-sm transition flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-xl">add</span>
              Yeni Çocuk Ekle
            </button>
          </div>
        )}

        {/* Search, Sort & Archive Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-light-secondary dark:text-text-dark-secondary">search</span>
            <input
              type="search"
              placeholder="Çocuk ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-lg focus:ring-2 focus:ring-primary transition text-text-light-primary dark:text-text-dark-primary placeholder:text-text-light-secondary dark:placeholder:text-text-dark-secondary"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-3 bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-lg focus:ring-2 focus:ring-primary transition w-full md:w-auto text-text-light-primary dark:text-text-dark-primary"
          >
            <option value="az">Alfabetik (A-Z)</option>
            <option value="za">Alfabetik (Z-A)</option>
          </select>
          {isAdmin && (
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`px-4 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 w-full md:w-auto ${
                showArchived
                  ? 'bg-primary text-white'
                  : 'bg-yaban-mid/20 hover:bg-yaban-mid/30 border border-yaban-mid text-text-light-primary dark:text-text-dark-primary'
              }`}
              title={showArchived ? 'Arşivlileri gizle' : 'Arşivlileri göster'}
            >
              <span className="material-symbols-outlined text-xl">inventory_2</span>
              {showArchived ? 'Arşiv: Açık' : 'Arşiv: Kapalı'}
            </button>
          )}
        </div>

        {/* Children List */}
        <div className="space-y-6">
          {filteredChildren.length === 0 ? (
            <div className="bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-xl p-12 text-center shadow-sm">
              <span className="material-symbols-outlined text-6xl text-text-light-secondary dark:text-text-dark-secondary mb-4 block">search_off</span>
              <p className="text-text-light-secondary dark:text-text-dark-secondary text-lg">Çocuk bulunamadı</p>
              <p className="text-text-light-secondary dark:text-text-dark-secondary text-sm mt-2">Arama terimini değiştirip tekrar deneyin</p>
            </div>
          ) : (
            filteredChildren.map(child => (
              <ChildCardV2
                key={child.id}
                child={child}
                settings={settings}
                unsavedChanges={unsavedChanges[child.id] || { scores: {}, descriptions: {}, absent: false }}
                onScoreClick={(catIndex, score) => updateScore(child.id, catIndex, score)}
                onAbsentToggle={() => toggleAbsent(child.id)}
                onDescriptionClick={(catIndex) => {
                  setDescriptionModal({
                    isOpen: true,
                    childId: child.id,
                    childName: child.name,
                    categoryIndex: catIndex,
                    categoryName: settings.categories[catIndex]
                  });
                }}
                isAdmin={isAdmin}
                onDelete={() => setDeleteModal({ isOpen: true, childId: child.id, childName: child.name })}
                onArchive={() => handleArchiveChild(child.id, child.name)}
                onUnarchive={() => handleUnarchiveChild(child.id, child.name)}
                onQuickFill={(score) => quickFillChild(child.id, score)}
                onCopyLast={() => copyLastEvaluation(child.id)}
              />
            ))
          )}
        </div>

        {/* Save Button */}
        {hasUnsavedChanges() && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="fixed bottom-8 right-8 bg-primary hover:bg-primary/90 text-white font-bold py-4 px-8 rounded-xl shadow-2xl transition flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed z-50 animate-slideUp"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Kaydediliyor...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-2xl">save</span>
                Tüm Değişiklikleri Kaydet
              </>
            )}
          </button>
        )}
      </div>

      {/* Description Modal */}
      <DescriptionModal
        isOpen={descriptionModal.isOpen}
        onClose={() => setDescriptionModal(prev => ({ ...prev, isOpen: false }))}
        onSave={(description) => {
          if (descriptionModal.childId !== null && descriptionModal.categoryIndex !== null) {
            updateDescription(descriptionModal.childId, descriptionModal.categoryIndex, description);
          }
        }}
        title={`${descriptionModal.childName} - ${descriptionModal.categoryName}`}
        initialValue={
          descriptionModal.childId && descriptionModal.categoryIndex !== null
            ? unsavedChanges[descriptionModal.childId]?.descriptions?.[descriptionModal.categoryIndex] || ''
            : ''
        }
      />

      {/* Add Child Modal */}
      <AddChildModal
        isOpen={showAddChildModal}
        onClose={() => setShowAddChildModal(false)}
        onAdd={handleAddChild}
        existingChildren={children.map(child => child.name)}
      />

      {/* Delete Child Modal */}
      <DeleteChildModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, childId: null, childName: '' })}
        onConfirm={handleDeleteChild}
        childName={deleteModal.childName}
      />
    </div>
  );
}
