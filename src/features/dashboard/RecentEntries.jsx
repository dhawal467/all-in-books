import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTransactionStore } from '../../stores/transactionStore';
import { usePartyStore } from '../../stores/partyStore';
import { useCategoryStore } from '../../stores/categoryStore';
import { useUiStore } from '../../stores/uiStore';
import { formatINR } from '../../utils/currency';
import { ArrowRight, Activity } from 'lucide-react';
import EmptyState from '../../components/EmptyState';

const TYPE_LABELS = {
  sale: 'Sale',
  receipt: 'Receipt',
  purchase: 'Purchase',
  expense: 'Expense',
  payment: 'Payment',
};

const BADGE_COLORS = {
  sale: 'bg-green-100 text-green-800',
  receipt: 'bg-emerald-100 text-emerald-800',
  purchase: 'bg-red-100 text-red-800',
  expense: 'bg-orange-100 text-orange-800',
  payment: 'bg-rose-100 text-rose-800',
};

function relativeTime(createdAt) {
  // createdAt is a unix timestamp (ms)
  const now = Date.now();
  const diffMs = now - createdAt;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
}

export default function RecentEntries() {
  const navigate = useNavigate();
  const transactions = useTransactionStore((state) => state.transactions);
  const { parties } = usePartyStore();
  const { categories } = useCategoryStore();
  const openModal = useUiStore((state) => state.openModal);

  const recent = useMemo(() => {
    // transactions are already sorted descending by date from the store
    return [...transactions]
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .slice(0, 5);
  }, [transactions]);

  if (recent.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6 p-4">
        <EmptyState 
          icon={Activity} 
          title="No recent activity" 
          message="Record a sale, purchase, or expense to see it here." 
          ctaText="Add Entry"
          onCtaClick={() => openModal('entryForm')}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Recent Entries</h2>
        <button
          onClick={() => navigate('/entries')}
          className="flex items-center gap-1 text-xs font-semibold text-accent active:opacity-70 transition-opacity"
        >
          View All <ArrowRight size={14} />
        </button>
      </div>

      {/* Entries */}
      <div className="divide-y divide-gray-100">
        {recent.map((tx) => {
          const party = parties.find((p) => p.id === tx.partyId);
          const category = categories.find((c) => c.id === tx.categoryId);
          const title = party ? party.name : (category ? category.name : 'Unknown');
          const isIn = ['sale', 'receipt'].includes(tx.type);
          const amount = formatINR(tx.totalAmount || tx.amount);

          return (
            <div
              key={tx.id}
              className="flex items-center justify-between px-4 py-3 active:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => openModal('entryDetail', tx)}
            >
              <div className="flex flex-col gap-1 min-w-0 mr-2">
                <span className="font-medium text-sm text-gray-900 truncate">{title}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${BADGE_COLORS[tx.type] || 'bg-gray-100 text-gray-700'}`}>
                    {TYPE_LABELS[tx.type] || tx.type}
                  </span>
                  <span className="text-[10px] text-gray-400">{relativeTime(tx.createdAt)}</span>
                </div>
              </div>
              <span className={`text-sm font-semibold whitespace-nowrap ${isIn ? 'text-green-600' : 'text-red-600'}`}>
                {isIn ? '+' : '-'}{amount}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
