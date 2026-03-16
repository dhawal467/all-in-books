import React, { useMemo } from 'react';
import { usePartyStore } from '../../stores/partyStore';
import { useCategoryStore } from '../../stores/categoryStore';
import { useUiStore } from '../../stores/uiStore';
import { formatINR } from '../../utils/currency';

export default function EntryRow({ transaction }) {
  const { parties } = usePartyStore();
  const { categories } = useCategoryStore();
  const openModal = useUiStore((state) => state.openModal);

  const party = useMemo(() => parties.find(p => p.id === transaction.partyId), [parties, transaction.partyId]);
  const category = useMemo(() => categories.find(c => c.id === transaction.categoryId), [categories, transaction.categoryId]);

  const isInType = ['sale', 'receipt'].includes(transaction.type);
  const colorClass = isInType ? 'text-income' : 'text-expense';
  
  const typeLabels = {
    sale: 'Sale',
    receipt: 'Receipt',
    purchase: 'Purchase',
    expense: 'Expense',
    payment: 'Payment'
  };

  const badgeColors = {
    sale: 'bg-green-100 text-green-800',
    receipt: 'bg-emerald-100 text-emerald-800',
    purchase: 'bg-red-100 text-red-800',
    expense: 'bg-orange-100 text-orange-800',
    payment: 'bg-rose-100 text-rose-800'
  };

  const title = party ? party.name : (category ? category.name : 'Unknown');
  const amount = formatINR(transaction.totalAmount || transaction.amount);

  return (
    <div 
      className="p-3 flex items-center justify-between active:bg-gray-50 cursor-pointer transition-colors"
      onClick={() => openModal('entryDetail', transaction)}
    >
      <div className="flex flex-col gap-1">
        <span className="font-medium text-primary line-clamp-1">{title}</span>
        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded w-fit ${badgeColors[transaction.type] || 'bg-gray-100 text-gray-800'}`}>
          {typeLabels[transaction.type] || transaction.type}
        </span>
      </div>
      <div className={`font-semibold ${colorClass}`}>
        {isInType ? '+' : '-'}{amount}
      </div>
    </div>
  );
}
