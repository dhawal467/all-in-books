import React, { useEffect, useMemo } from 'react';
import { useTransactionStore } from '../../stores/transactionStore';
import { formatINR } from '../../utils/currency';
import { Receipt, ArrowUpRight, ArrowDownLeft, Scale } from 'lucide-react';

const OUTPUT_TYPES = ['sale', 'receipt'];
const INPUT_TYPES  = ['purchase', 'expense'];

/**
 * GSTSummary
 * Props:
 *   - from {string} YYYY-MM-DD
 *   - to   {string} YYYY-MM-DD
 */
export default function GSTSummary({ from, to }) {
  const { transactions, load, loading } = useTransactionStore();

  useEffect(() => {
    if (from && to) {
      load({ from, to });
    }
  }, [from, to, load]);

  const { outputGST, inputGST, netGST, outputRows, inputRows } = useMemo(() => {
    const outputRows = [
      {
        label: 'Sales',
        types: ['sale'],
        gst: transactions.filter(t => t.type === 'sale')
                        .reduce((s, t) => s + (Number(t.gstAmount) || 0), 0),
        taxable: transactions.filter(t => t.type === 'sale')
                             .reduce((s, t) => s + (Number(t.amount) || 0), 0),
      },
      {
        label: 'Receipts',
        types: ['receipt'],
        gst: transactions.filter(t => t.type === 'receipt')
                        .reduce((s, t) => s + (Number(t.gstAmount) || 0), 0),
        taxable: transactions.filter(t => t.type === 'receipt')
                             .reduce((s, t) => s + (Number(t.amount) || 0), 0),
      },
    ];

    const inputRows = [
      {
        label: 'Purchases',
        types: ['purchase'],
        gst: transactions.filter(t => t.type === 'purchase')
                        .reduce((s, t) => s + (Number(t.gstAmount) || 0), 0),
        taxable: transactions.filter(t => t.type === 'purchase')
                             .reduce((s, t) => s + (Number(t.amount) || 0), 0),
      },
      {
        label: 'Expenses',
        types: ['expense'],
        gst: transactions.filter(t => t.type === 'expense')
                        .reduce((s, t) => s + (Number(t.gstAmount) || 0), 0),
        taxable: transactions.filter(t => t.type === 'expense')
                             .reduce((s, t) => s + (Number(t.amount) || 0), 0),
      },
    ];

    const outputGST = outputRows.reduce((s, r) => s + r.gst, 0);
    const inputGST  = inputRows.reduce((s, r) => s + r.gst, 0);
    const netGST    = outputGST - inputGST;

    return { outputGST, inputGST, netGST, outputRows, inputRows };
  }, [transactions]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400 text-sm gap-2">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        Loading…
      </div>
    );
  }

  const netPositive = netGST >= 0;
  const netColor    = netPositive ? '#16A34A' : '#EF4444';
  const netBg       = netPositive ? '#dcfce7' : '#fee2e2';
  const netLabel    = netPositive ? 'GST Payable' : 'GST Refundable';

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        {/* Output GST */}
        <div className="bg-orange-50 rounded-2xl p-3 flex flex-col gap-1">
          <div className="flex items-center gap-1">
            <ArrowUpRight size={12} className="text-orange-400" />
            <span className="text-[10px] font-semibold text-orange-400 uppercase tracking-wide">Output</span>
          </div>
          <span className="text-sm font-bold text-orange-700 leading-tight break-all">
            {formatINR(outputGST)}
          </span>
          <span className="text-[10px] text-orange-300">GST Collected</span>
        </div>

        {/* Input GST */}
        <div className="bg-blue-50 rounded-2xl p-3 flex flex-col gap-1">
          <div className="flex items-center gap-1">
            <ArrowDownLeft size={12} className="text-blue-400" />
            <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wide">Input</span>
          </div>
          <span className="text-sm font-bold text-blue-700 leading-tight break-all">
            {formatINR(inputGST)}
          </span>
          <span className="text-[10px] text-blue-300">GST Paid</span>
        </div>

        {/* Net GST */}
        <div className="rounded-2xl p-3 flex flex-col gap-1" style={{ background: netPositive ? '#fff7ed' : '#f0fdf4' }}>
          <div className="flex items-center gap-1">
            <Scale size={12} style={{ color: netColor }} />
            <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: netColor }}>Net</span>
          </div>
          <span className="text-sm font-bold leading-tight break-all" style={{ color: netColor }}>
            {formatINR(Math.abs(netGST))}
          </span>
          <span className="text-[10px]" style={{ color: netColor, opacity: 0.6 }}>{netLabel}</span>
        </div>
      </div>

      {/* Net GST Banner */}
      <div
        className="rounded-2xl px-4 py-3 flex items-center justify-between"
        style={{ background: netBg }}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: netColor }}>
            {netLabel}
          </p>
          <p className="text-xl font-extrabold mt-0.5" style={{ color: netColor }}>
            {formatINR(Math.abs(netGST))}
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: netColor, opacity: 0.7 }}>
            Output GST {formatINR(outputGST)} − Input Credit {formatINR(inputGST)}
          </p>
        </div>
        <Receipt size={32} style={{ color: netColor }} strokeWidth={1.5} />
      </div>

      {/* Output GST Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="px-4 py-3 border-b border-gray-50">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Output GST (Collected)</p>
        </div>
        <div className="divide-y divide-gray-50">
          {outputRows.map((row) => (
            <div key={row.label} className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700 font-medium">{row.label}</p>
                <p className="text-xs text-gray-400">Taxable: {formatINR(row.taxable)}</p>
              </div>
              <span className="text-sm font-bold text-orange-600">{formatINR(row.gst)}</span>
            </div>
          ))}
          <div className="px-4 py-3 flex items-center justify-between bg-orange-50/50">
            <span className="text-sm font-bold text-gray-700">Total Output</span>
            <span className="text-sm font-bold text-orange-700">{formatINR(outputGST)}</span>
          </div>
        </div>
      </div>

      {/* Input GST Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="px-4 py-3 border-b border-gray-50">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Input GST Credit</p>
        </div>
        <div className="divide-y divide-gray-50">
          {inputRows.map((row) => (
            <div key={row.label} className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700 font-medium">{row.label}</p>
                <p className="text-xs text-gray-400">Taxable: {formatINR(row.taxable)}</p>
              </div>
              <span className="text-sm font-bold text-blue-600">{formatINR(row.gst)}</span>
            </div>
          ))}
          <div className="px-4 py-3 flex items-center justify-between bg-blue-50/50">
            <span className="text-sm font-bold text-gray-700">Total Input</span>
            <span className="text-sm font-bold text-blue-700">{formatINR(inputGST)}</span>
          </div>
        </div>
      </div>

      {/* Info note */}
      <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-50 rounded-xl border border-amber-100">
        <span className="text-amber-500 text-sm mt-0.5">ℹ️</span>
        <p className="text-xs text-amber-700 leading-relaxed">
          GST amounts are based on the <strong>gstAmount</strong> recorded on each transaction. Only transactions with a GST amount set will be included.
        </p>
      </div>
    </div>
  );
}
