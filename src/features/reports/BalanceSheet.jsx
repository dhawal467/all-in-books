import React, { useEffect, useMemo } from 'react';
import { useTransactionStore } from '../../stores/transactionStore';
import { usePartyStore } from '../../stores/partyStore';
import { formatINR } from '../../utils/currency';
import { Banknote, Users, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const INFLOW_TYPES  = ['sale', 'receipt'];
const OUTFLOW_TYPES = ['purchase', 'expense', 'payment'];

/**
 * BalanceSheet
 * No date filter — always shows all-time snapshot.
 */
export default function BalanceSheet() {
  const { transactions, load: loadTx, loading: txLoading } = useTransactionStore();
  const { parties, load: loadParties, loading: partyLoading } = usePartyStore();

  // Load ALL transactions (no date filter) and parties on mount
  useEffect(() => {
    loadTx();       // no args = all-time
    loadParties();
  }, [loadTx, loadParties]);

  const { cashBalance, toReceive, toPay, netPosition } = useMemo(() => {
    // Cash / Bank balance = all-time total IN minus total OUT
    const totalIn  = transactions
      .filter(t => INFLOW_TYPES.includes(t.type))
      .reduce((s, t) => s + (Number(t.amount) || 0), 0);

    const totalOut = transactions
      .filter(t => OUTFLOW_TYPES.includes(t.type))
      .reduce((s, t) => s + (Number(t.amount) || 0), 0);

    const cashBalance = totalIn - totalOut;

    // Outstanding from parties
    let toReceive = 0;
    let toPay     = 0;

    for (const party of parties) {
      const partyTx = transactions.filter(t => t.partyId === party.id);

      const partyIn  = partyTx.filter(t => INFLOW_TYPES.includes(t.type))
                               .reduce((s, t) => s + (Number(t.amount) || 0), 0);
      const partyOut = partyTx.filter(t => OUTFLOW_TYPES.includes(t.type))
                               .reduce((s, t) => s + (Number(t.amount) || 0), 0);

      const balance = partyIn - partyOut;
      if (balance > 0) toReceive += balance;
      else if (balance < 0) toPay += Math.abs(balance);
    }

    const netPosition = cashBalance + toReceive - toPay;

    return { cashBalance, toReceive, toPay, netPosition };
  }, [transactions, parties]);

  const loading = txLoading || partyLoading;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400 text-sm gap-2">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        Loading…
      </div>
    );
  }

  const NetIcon  = netPosition > 0 ? TrendingUp : netPosition < 0 ? TrendingDown : Minus;
  const netColor = netPosition >= 0 ? '#16A34A' : '#EF4444';
  const netBg    = netPosition >= 0 ? '#dcfce7' : '#fee2e2';

  return (
    <div className="space-y-4">
      {/* All-time badge */}
      <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 rounded-xl border border-purple-100">
        <span className="text-purple-500 text-sm">📅</span>
        <p className="text-xs font-medium text-purple-700">
          All-time snapshot — date filter does not apply to this view.
        </p>
      </div>

      {/* Assets */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="px-4 py-3 border-b border-gray-50">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Assets</p>
        </div>

        {/* Cash / Bank Balance */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
              <Banknote size={18} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Cash / Bank Balance</p>
              <p className="text-xs text-gray-400">All-time In minus Out</p>
            </div>
          </div>
          <span className={`text-sm font-bold ${cashBalance >= 0 ? 'text-green-700' : 'text-red-600'}`}>
            {formatINR(cashBalance)}
          </span>
        </div>

        {/* To Receive */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
              <Users size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">To Receive</p>
              <p className="text-xs text-gray-400">Outstanding from customers</p>
            </div>
          </div>
          <span className="text-sm font-bold text-blue-700">{formatINR(toReceive)}</span>
        </div>

        {/* Total Assets */}
        <div className="px-4 py-3 flex items-center justify-between bg-gray-50/80 rounded-b-2xl">
          <span className="text-sm font-bold text-gray-700">Total Assets</span>
          <span className="text-sm font-bold text-gray-900">
            {formatINR(Math.max(0, cashBalance) + toReceive)}
          </span>
        </div>
      </div>

      {/* Liabilities */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="px-4 py-3 border-b border-gray-50">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Liabilities</p>
        </div>

        {/* To Pay */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
              <Users size={18} className="text-red-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">To Pay</p>
              <p className="text-xs text-gray-400">Amount owed to suppliers</p>
            </div>
          </div>
          <span className="text-sm font-bold text-red-600">{formatINR(toPay)}</span>
        </div>

        {/* Total Liabilities */}
        <div className="px-4 py-3 flex items-center justify-between bg-gray-50/80 rounded-b-2xl">
          <span className="text-sm font-bold text-gray-700">Total Liabilities</span>
          <span className="text-sm font-bold text-gray-900">{formatINR(toPay)}</span>
        </div>
      </div>

      {/* Net Position Banner */}
      <div
        className="rounded-2xl px-4 py-4 flex items-center justify-between"
        style={{ background: netBg }}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: netColor }}>
            Net Position
          </p>
          <p className="text-2xl font-extrabold mt-0.5" style={{ color: netColor }}>
            {formatINR(Math.abs(netPosition))}
          </p>
          <p className="text-[10px] mt-1 opacity-70" style={{ color: netColor }}>
            Cash {formatINR(cashBalance)} + Receivable {formatINR(toReceive)} − Payable {formatINR(toPay)}
          </p>
        </div>
        <NetIcon size={36} style={{ color: netColor }} strokeWidth={1.5} />
      </div>
    </div>
  );
}
