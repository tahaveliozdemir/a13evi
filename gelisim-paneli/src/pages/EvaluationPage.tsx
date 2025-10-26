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
    selectedUnit,
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

  // Get date, evaluator, and unit from navigation state
  useEffect(() => {
    const state = location.state as { date?: string; evaluator?: string; unit?: string } | null;
    if (state?.date && state?.evaluator) {
      setEvaluationInfo(state.date, state.evaluator, state.unit);
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
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header with Date, Evaluator & Unit Info */}
        <div className="card p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div>
                <p className="text-sm text-text-muted">Tarih</p>
                <p className="font-bold text-lg">{formatDate(selectedDate)}</p>
              </div>
              <div>
                <p className="text-sm text-text-muted">Değerlendiren</p>
                <p className="font-bold text-lg">{selectedEvaluator}</p>
              </div>
              {selectedUnit && (
                <div>
                  <p className="text-sm text-text-muted">Birim</p>
                  <p className="font-bold text-lg">{selectedUnit}</p>
                </div>
              )}
            </div>
            <button
              onClick={handleChangeDate}
              className="bg-gray-500/20 hover:bg-gray-500/30 px-4 py-2 rounded-lg font-medium transition"
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
              className="w-full md:w-auto bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Yeni Çocuk Ekle
            </button>
          </div>
        )}

        {/* Search, Sort & Archive Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            type="search"
            placeholder="Çocuk ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-3 bg-input-bg border border-input-border rounded-lg focus:ring-2 focus:ring-accent transition"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-3 bg-input-bg border border-input-border rounded-lg focus:ring-2 focus:ring-accent transition w-full md:w-auto"
          >
            <option value="az">Alfabetik (A-Z)</option>
            <option value="za">Alfabetik (Z-A)</option>
          </select>
          {isAdmin && (
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`px-4 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 w-full md:w-auto ${
                showArchived
                  ? 'bg-accent text-white'
                  : 'bg-gray-500/20 hover:bg-gray-500/30'
              }`}
              title={showArchived ? 'Arşivlileri gizle' : 'Arşivlileri göster'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              {showArchived ? 'Arşiv: Açık' : 'Arşiv: Kapalı'}
            </button>
          )}
        </div>

        {/* Children List */}
        <div className="space-y-6">
          {filteredChildren.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-text-muted">Çocuk bulunamadı.</p>
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
            className="fixed bottom-8 right-8 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 px-8 rounded-lg shadow-2xl transition flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed z-50"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Kaydediliyor...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="m9 12 2 2 4-4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
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
