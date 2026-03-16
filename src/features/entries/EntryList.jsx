import React, { useMemo } from 'react';
import EntryRow from './EntryRow';
import EmptyState from '../../components/EmptyState';
import { FileText } from 'lucide-react';

export default function EntryList({ transactions, loading }) {
  const grouped = useMemo(() => {
    const groups = {};
    transactions.forEach(t => {
      if (!groups[t.date]) groups[t.date] = [];
      groups[t.date].push(t);
    });
    // Dates are YYYY-MM-DD format
    return Object.entries(groups).sort(([dateA], [dateB]) => dateB.localeCompare(dateA));
  }, [transactions]);

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading entries...</div>;
  }

  if (transactions.length === 0) {
    return (
      <div className="mt-8">
        <EmptyState 
          icon={FileText} 
          title="No entries found" 
          message="Change the filters or add a new entry." 
        />
      </div>
    );
  }

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
  };

  return (
    <div className="space-y-6">
      {grouped.map(([date, txs]) => (
        <div key={date} className="space-y-2">
          <h3 className="text-sm font-medium text-gray-500 sticky top-0 py-1 bg-gray-50 z-[5]">
            {formatDate(date)}
          </h3>
          <div className="bg-white rounded-[12px] border border-[#B8D0E8] shadow-sm divide-y divide-gray-100 overflow-hidden">
            {txs.map(tx => (
              <EntryRow key={tx.id} transaction={tx} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
