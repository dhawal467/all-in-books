import React, { useState, useEffect } from 'react';
import { useTransactionStore } from '../../stores/transactionStore';
import EntryList from './EntryList';

const FILTERS = [
  { label: 'All', value: '' },
  { label: 'Sales', value: 'sale' },
  { label: 'Purchases', value: 'purchase' },
  { label: 'Expenses', value: 'expense' },
  { label: 'Receipts', value: 'receipt' },
  { label: 'Payments', value: 'payment' },
];

export default function EntriesPage() {
  const [filterType, setFilterType] = useState('');
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  
  const { transactions, load, loading } = useTransactionStore();

  useEffect(() => {
    const [year, month] = currentMonth.split('-');
    if (year && month) {
      const from = `${year}-${month}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const to = `${year}-${month}-${lastDay}`;
      load({ type: filterType || undefined, from, to });
    }
  }, [filterType, currentMonth, load]);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white px-4 py-3 shadow-sm border-b border-gray-100 flex flex-col gap-3">
        <input 
          type="month" 
          value={currentMonth}
          onChange={(e) => setCurrentMonth(e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 min-h-[44px] text-primary focus:outline-none focus:ring-1 focus:ring-accent"
        />
        
        <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-hide" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
          {FILTERS.map(f => (
            <button
              key={f.label}
              onClick={() => setFilterType(f.value)}
              className={`whitespace-nowrap px-4 min-h-[40px] rounded-full text-sm font-medium transition-colors ${
                filterType === f.value 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-4 pb-[100px] overflow-y-auto">
        <EntryList transactions={transactions} loading={loading} />
      </div>
    </div>
  );
}
