import React, { useEffect, useState, useMemo } from 'react';
import { Search, Users, Plus } from 'lucide-react';
import { usePartyStore } from '../../stores/partyStore';
import { useTransactionStore } from '../../stores/transactionStore';
import { useUiStore } from '../../stores/uiStore';
import PartyCard from './PartyCard';
import EmptyState from '../../components/EmptyState';

export default function PartiesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { parties, load: loadParties } = usePartyStore();
  const { transactions, load: loadTransactions } = useTransactionStore();
  const { openModal } = useUiStore();

  useEffect(() => {
    loadParties();
    loadTransactions(); // Gets all transactions for the 'main' book to compute balances
  }, [loadParties, loadTransactions]);

  // Compute real-time balances
  const partyBalances = useMemo(() => {
    const balances = {};
    
    // Initialize with 0 or opening balance
    parties.forEach(p => {
      balances[p.id] = p.openingBalance || 0;
    });

    // Add transaction impacts
    // In-types (sale, receipt) -> Positive balance for party (They owe us)
    // Out-types (purchase, expense, payment) -> Negative balance for party (We owe them)
    transactions.forEach(t => {
      if (!t.partyId || balances[t.partyId] === undefined) return;
      
      const amount = Number(t.totalAmount || t.amount) || 0;
      if (['sale', 'receipt'].includes(t.type)) {
        balances[t.partyId] += amount;
      } else if (['purchase', 'expense', 'payment'].includes(t.type)) {
        balances[t.partyId] -= amount;
      }
    });

    return balances;
  }, [parties, transactions]);

  // Filter & Group
  const { toReceive, toPay, settled } = useMemo(() => {
    const filtered = parties.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (p.phone && p.phone.includes(searchQuery))
    );

    const receive = [];
    const pay = [];
    const setl = [];

    filtered.forEach(p => {
      const bal = partyBalances[p.id] || 0;
      // Precision fix for JS floats
      const cleanBal = Math.round(bal * 100) / 100;

      if (cleanBal > 0) receive.push({ party: p, balance: cleanBal });
      else if (cleanBal < 0) pay.push({ party: p, balance: cleanBal });
      else setl.push({ party: p, balance: 0 });
    });

    // Sort by name within groups
    const sortFn = (a, b) => a.party.name.localeCompare(b.party.name);
    receive.sort(sortFn);
    pay.sort(sortFn);
    setl.sort(sortFn);

    return { toReceive: receive, toPay: pay, settled: setl };
  }, [parties, partyBalances, searchQuery]);

  return (
    <div className="flex flex-col h-full bg-gray-50 pb-[100px] relative">
      
      {/* Search Bar */}
      <div className="bg-white px-4 py-3 shadow-sm border-b border-gray-100 flex-shrink-0 sticky top-14 z-10">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search parties..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 min-h-[44px] bg-gray-50 border border-gray-200 rounded-xl text-primary focus:outline-none focus:ring-1 focus:ring-accent transition-shadow"
          />
        </div>
      </div>

      {parties.length === 0 ? (
        <div className="mt-12 px-4">
          <EmptyState 
            icon={Users} 
            title="No parties yet" 
            message="Add customers and vendors to track their balances securely." 
            ctaText="Add First Party"
            onCtaClick={() => openModal('partyForm')}
          />
        </div>
      ) : (
        <div className="flex-1 p-4 space-y-6 overflow-y-auto">
          
          {toReceive.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">
                To Receive ({toReceive.length})
              </h3>
              <div className="bg-white rounded-[12px] border border-gray-100 shadow-sm divide-y divide-gray-100 overflow-hidden">
                {toReceive.map(item => (
                  <PartyCard key={item.party.id} party={item.party} balance={item.balance} />
                ))}
              </div>
            </section>
          )}

          {toPay.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">
                To Pay ({toPay.length})
              </h3>
              <div className="bg-white rounded-[12px] border border-gray-100 shadow-sm divide-y divide-gray-100 overflow-hidden">
                {toPay.map(item => (
                  <PartyCard key={item.party.id} party={item.party} balance={item.balance} />
                ))}
              </div>
            </section>
          )}

          {settled.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">
                Settled ({settled.length})
              </h3>
              <div className="bg-white rounded-[12px] border border-gray-100 shadow-sm divide-y divide-gray-100 overflow-hidden opacity-80">
                {settled.map(item => (
                  <PartyCard key={item.party.id} party={item.party} balance={item.balance} />
                ))}
              </div>
            </section>
          )}

          {toReceive.length === 0 && toPay.length === 0 && settled.length === 0 && searchQuery && (
            <div className="text-center py-8 text-gray-500">
              No parties matching "{searchQuery}"
            </div>
          )}
        </div>
      )}

      {/* Floating Action Button (Overrides global FAB contextially on this tab via App.jsx z-index rendering) */}
      <button
        onClick={() => openModal('partyForm')}
        className="fixed bottom-[88px] right-4 w-14 h-14 bg-accent text-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform z-20"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

    </div>
  );
}
