import React, { useState, useEffect } from 'react';
import { useCategoryStore } from '../../stores/categoryStore';
import { useUiStore } from '../../stores/uiStore';
import { Trash2, Plus, Tag } from 'lucide-react';

export default function CategorySettings() {
  const { categories, load, add, remove } = useCategoryStore();
  const { showToast } = useUiStore();
  const [newCat, setNewCat] = useState({ name: '', type: 'income', color: '#27AE60' });

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newCat.name.trim()) return;
    try {
      await add({
        name: newCat.name.trim(),
        type: newCat.type,
        color: newCat.color
      });
      setNewCat({ ...newCat, name: '' });
      showToast('Category added', 'success');
    } catch (err) {
      showToast('Error adding category', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      if (window.confirm('Are you sure you want to delete this category? Past entries will still keep it, but it won\'t appear in new dropdowns.')) {
        await remove(id);
        showToast('Category deleted', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Error deleting category', 'error');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mt-4">
      <h2 className="text-base font-semibold text-primary mb-1">Custom Categories</h2>
      <p className="text-xs text-gray-500 mb-4">Manage categories for entries</p>

      {/* Add New Category */}
      <form onSubmit={handleAdd} className="flex flex-col gap-3 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="New category name"
            value={newCat.name}
            onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
            className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent transition-colors"
          />
          <button
            type="submit"
            disabled={!newCat.name.trim()}
            className="flex items-center justify-center p-2 bg-accent text-white rounded-lg disabled:opacity-50 transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>
        
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="radio"
              name="catType"
              checked={newCat.type === 'income'}
              onChange={() => setNewCat({ ...newCat, type: 'income', color: '#27AE60' })}
              className="accent-green-600 w-4 h-4 cursor-pointer"
            />
            Income
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="radio"
              name="catType"
              checked={newCat.type === 'expense'}
              onChange={() => setNewCat({ ...newCat, type: 'expense', color: '#E74C3C' })}
              className="accent-red-600 w-4 h-4 cursor-pointer"
            />
            Expense
          </label>
        </div>
      </form>

      {/* Categories List */}
      <div className="space-y-4">
        {/* Income Categories */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Income</h3>
          <div className="space-y-2">
            {categories.filter(c => c.type === 'income').map(cat => (
              <div key={cat.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-white">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color || '#27AE60' }} />
                  <span className="text-sm text-primary font-medium">{cat.name}</span>
                </div>
                {!cat.isDefault && (
                  <button onClick={() => handleDelete(cat.id)} className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Expense Categories */}
        <div className="pt-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Expense</h3>
          <div className="space-y-2">
            {categories.filter(c => c.type === 'expense').map(cat => (
              <div key={cat.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-white">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color || '#E74C3C' }} />
                  <span className="text-sm text-primary font-medium">{cat.name}</span>
                </div>
                {!cat.isDefault && (
                  <button onClick={() => handleDelete(cat.id)} className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
