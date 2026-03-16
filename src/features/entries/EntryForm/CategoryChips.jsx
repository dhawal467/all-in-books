import React, { useState, useEffect } from 'react';
import { useCategoryStore } from '../../../stores/categoryStore';
import { useUiStore } from '../../../stores/uiStore';
import Modal from '../../../components/Modal';

export default function CategoryChips({ activeType, value, onChange }) {
  const { categories, add, load } = useCategoryStore();
  const { openModal, closeModal } = useUiStore();
  
  const [newCatName, setNewCatName] = useState('');
  
  useEffect(() => {
    load();
  }, [load]);

  const isIncome = activeType === 'SALE' || activeType === 'RECEIPT';
  const categoryType = isIncome ? 'income' : 'expense';

  // Filter and sort by ID descending (proxy for MRU if no usage count exists)
  const filteredCategories = categories
    .filter(c => c.type === categoryType)
    .sort((a, b) => b.id - a.id);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    
    try {
      const newId = await add({
        name: newCatName.trim(),
        type: categoryType
      });
      onChange(newId);
      closeModal('addCategory');
      setNewCatName('');
    } catch (err) {
      console.error('Failed to add category:', err);
    }
  };

  return (
    <div className="px-4 pb-4">
      <div className="flex overflow-x-auto gap-2 no-scrollbar items-center">
        <button
          onClick={() => openModal('addCategory')}
          className="px-4 py-1.5 rounded-full text-sm font-medium border border-dashed border-primary text-primary flex-shrink-0 hover:bg-primary/5 transition-colors"
        >
          + Add
        </button>
        {filteredCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onChange(cat.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 transition-colors ${
              value === cat.id
                ? 'bg-primary text-white'
                : 'bg-primary/10 text-primary hover:bg-primary/20'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <Modal name="addCategory" title="Add Category">
        {() => (
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-primary mb-1">
                Category Name
              </label>
              <input
                type="text"
                autoFocus
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="w-full p-3 bg-[#F4F8FA] border border-[#B8D0E8] rounded-[12px] focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="E.g., Office Supplies"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  closeModal('addCategory');
                  setNewCatName('');
                }}
                className="px-4 py-2 text-primary font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newCatName.trim()}
                className="px-4 py-2 bg-primary text-white rounded-[12px] font-medium disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
