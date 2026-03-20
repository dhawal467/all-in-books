import React, { useEffect, useCallback } from 'react';
import { useTransactionStore } from '../../stores/transactionStore';
import { usePartyStore } from '../../stores/partyStore';
import { useCategoryStore } from '../../stores/categoryStore';
import StatusDot from '../../components/StatusDot';
import CashFlowCards from './CashFlowCards';
import OutstandingStrip from './OutstandingStrip';
import WeekChart from './WeekChart';
import RecentEntries from './RecentEntries';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export default function Dashboard() {
  const loadTransactions = useTransactionStore((state) => state.load);
  const loadParties = usePartyStore((state) => state.load);
  const loadCategories = useCategoryStore((state) => state.load);
  const { canInstall, promptInstall } = usePWAInstall();

  const refreshAll = useCallback(() => {
    loadTransactions();
    loadParties();
    loadCategories();
  }, [loadTransactions, loadParties, loadCategories]);

  // Initial load
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Reload on window focus (user navigates back)
  useEffect(() => {
    window.addEventListener('focus', refreshAll);
    return () => window.removeEventListener('focus', refreshAll);
  }, [refreshAll]);

  // Today's date strip
  const todayLabel = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-[100px]">
      {/* PWA Install Banner */}
      {canInstall && (
        <div className="bg-primary text-white px-4 py-3 flex justify-between items-center shadow-sm">
          <div>
            <p className="font-semibold text-sm">Add to Home Screen</p>
            <p className="text-xs opacity-90 mt-0.5">Install All in Books for offline access</p>
          </div>
          <button 
            onClick={promptInstall}
            className="px-4 py-1.5 bg-accent text-white text-sm font-semibold rounded-lg shadow-sm active:scale-95 transition-transform"
          >
            Install
          </button>
        </div>
      )}

      {/* Date Strip */}
      <div className="px-4 pt-3 pb-1">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{todayLabel}</p>
      </div>

      {/* Scrollable Content */}
      <div className="px-4 pt-2 space-y-0">
        <CashFlowCards />
        <OutstandingStrip />
        <WeekChart />
        <RecentEntries />
      </div>
    </div>
  );
}
