import React, { useMemo, useState } from 'react';
import { usePartyStore } from '../../stores/partyStore';
import { useCategoryStore } from '../../stores/categoryStore';
import { useTransactionStore } from '../../stores/transactionStore';
import { useUiStore } from '../../stores/uiStore';
import { formatINR } from '../../utils/currency';
import { Trash2, Edit2, Info, Image as ImageIcon, X } from 'lucide-react';

export default function EntryDetail() {
  const modalState = useUiStore(state => state.modals['entryDetail']);
  const transaction = modalState?.data;
  const closeModal = useUiStore(state => state.closeModal);
  const showToast = useUiStore(state => state.showToast);
  const { remove } = useTransactionStore();
  const { parties } = usePartyStore();
  const { categories } = useCategoryStore();
  
  const [showLightbox, setShowLightbox] = useState(false);

  const party = useMemo(() => parties.find(p => p.id === transaction?.partyId), [parties, transaction?.partyId]);
  const category = useMemo(() => categories.find(c => c.id === transaction?.categoryId), [categories, transaction?.categoryId]);

  if (!transaction) return null;

  const typeLabels = {
    sale: 'Sale',
    receipt: 'Receipt',
    purchase: 'Purchase',
    expense: 'Expense',
    payment: 'Payment'
  };

  const isInType = ['sale', 'receipt'].includes(transaction.type);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      await remove(transaction.id);
      closeModal('entryDetail');
      showToast('Entry deleted');
    }
  };

  const handleEdit = () => {
    // T-3.1 requirement: placeholder edit button, feature added in later epic, but we can open EntryForm if needed.
    closeModal('entryDetail');
    useUiStore.getState().openModal('entryForm', transaction);
  };

  return (
    <div className="pb-safe space-y-4 px-4 pt-2">
      <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4 border border-gray-100">
        <div>
          <p className="text-sm text-gray-500">Amount</p>
          <p className={`text-2xl font-bold ${isInType ? 'text-income' : 'text-expense'}`}>
            {formatINR(transaction.totalAmount || transaction.amount)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Type</p>
          <p className="font-medium text-primary">{typeLabels[transaction.type]}</p>
        </div>
      </div>

      <div className="space-y-3 p-1">
        <div className="flex justify-between border-b border-gray-100 pb-2">
          <span className="text-gray-500">Date</span>
          <span className="font-medium">{new Date(transaction.date).toLocaleDateString('en-GB')}</span>
        </div>
        
        {party && (
          <div className="flex justify-between border-b border-gray-100 pb-2">
            <span className="text-gray-500">Party</span>
            <span className="font-medium text-right">{party.name}</span>
          </div>
        )}
        
        {category && (
          <div className="flex justify-between border-b border-gray-100 pb-2">
            <span className="text-gray-500">Category</span>
            <span className="font-medium text-right">{category.name}</span>
          </div>
        )}

        {transaction.gstRate > 0 && (
          <div className="flex flex-col border-b border-gray-100 pb-2 gap-1 bg-blue-50/50 p-3 rounded-lg mt-2">
            <div className="flex items-center gap-1 text-sm text-accent mb-1 font-medium">
              <Info size={14} /> GST Details
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Base Amount</span>
              <span>{formatINR(transaction.amount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">GST ({transaction.gstRate}%)</span>
              <span>{formatINR(transaction.gstAmount)}</span>
            </div>
            <div className="flex justify-between font-medium mt-1 pt-1 border-t border-blue-100/50">
              <span>Total</span>
              <span>{formatINR(transaction.totalAmount)}</span>
            </div>
          </div>
        )}

        {transaction.note && (
          <div className="border-b border-gray-100 pb-2">
            <span className="block text-gray-500 mb-1">Note</span>
            <span className="text-sm text-gray-800 whitespace-pre-wrap">{transaction.note}</span>
          </div>
        )}

        {transaction.photoBase64 && (
          <div className="pt-2">
            <span className="block text-gray-500 mb-2">Attachment</span>
            <div 
              onClick={() => setShowLightbox(true)}
              className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 cursor-pointer active:opacity-80"
            >
              <img src={transaction.photoBase64} alt="Receipt" className="object-cover w-full h-full" />
              <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                <ImageIcon size={20} className="text-white drop-shadow-md" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-4 border-t border-gray-100 mt-4">
        <button 
          onClick={handleDelete}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-expense bg-red-50 font-medium active:bg-red-100 transition-colors"
        >
          <Trash2 size={18} /> Delete
        </button>
        <button 
          onClick={handleEdit}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-primary bg-gray-100 font-medium active:bg-gray-200 transition-colors"
        >
          <Edit2 size={18} /> Edit
        </button>
      </div>

      {/* Lightbox for full image display */}
      {showLightbox && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col backdrop-blur-sm animate-in fade-in duration-200">
          <div className="p-4 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent">
            <span className="text-white font-medium">Attachment</span>
            <button 
              onClick={() => setShowLightbox(false)} 
              className="text-white p-2 bg-white/10 rounded-full active:bg-white/20"
            >
              <X size={24} />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
            <img 
              src={transaction.photoBase64} 
              alt="Receipt Full" 
              className="max-w-full max-h-[80vh] object-contain rounded-lg" 
            />
          </div>
        </div>
      )}
    </div>
  );
}
