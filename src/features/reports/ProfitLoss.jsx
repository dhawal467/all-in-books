import React, { useEffect, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts';
import { useTransactionStore } from '../../stores/transactionStore';
import { formatINR, formatINRShort } from '../../utils/currency';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const REVENUE_TYPES  = ['sale', 'receipt'];
const EXPENSE_TYPES  = ['purchase', 'expense', 'payment'];
const COLOR_REVENUE  = '#3B82F6'; // blue-500
const COLOR_EXPENSE  = '#EF4444'; // red-500
const COLOR_NET_POS  = '#16A34A'; // green-600
const COLOR_NET_NEG  = '#EF4444'; // red-500

/** Custom tooltip for Recharts */
function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-lg shadow-md px-3 py-2 text-xs">
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.fill }} />
          <span className="text-gray-500 font-medium">{p.name}:</span>
          <span className="font-bold">{formatINR(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * ProfitLoss
 * Props:
 *   - from {string} YYYY-MM-DD
 *   - to   {string} YYYY-MM-DD
 */
export default function ProfitLoss({ from, to }) {
  const { transactions, load, loading } = useTransactionStore();

  // Reload whenever date range changes
  useEffect(() => {
    if (from && to) {
      load({ from, to });
    }
  }, [from, to, load]);

  const { revenue, expenses, net } = useMemo(() => {
    const revenue  = transactions
      .filter((t) => REVENUE_TYPES.includes(t.type))
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const expenses = transactions
      .filter((t) => EXPENSE_TYPES.includes(t.type))
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    return { revenue, expenses, net: revenue - expenses };
  }, [transactions]);

  const chartData = [
    { name: 'Revenue', value: revenue, fill: COLOR_REVENUE },
    { name: 'Expenses', value: expenses, fill: COLOR_EXPENSE },
  ];

  const netColor  = net >= 0 ? COLOR_NET_POS : COLOR_NET_NEG;
  const NetIcon   = net > 0 ? TrendingUp : net < 0 ? TrendingDown : Minus;
  const netLabel  = net >= 0 ? 'Net Profit' : 'Net Loss';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400 text-sm gap-2">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        Loading…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        {/* Revenue */}
        <div className="bg-blue-50 rounded-2xl p-3 flex flex-col gap-1">
          <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wide">Revenue</span>
          <span className="text-sm font-bold text-blue-700 leading-tight break-all">
            {formatINRShort(revenue)}
          </span>
        </div>

        {/* Expenses */}
        <div className="bg-red-50 rounded-2xl p-3 flex flex-col gap-1">
          <span className="text-[10px] font-semibold text-red-400 uppercase tracking-wide">Expenses</span>
          <span className="text-sm font-bold text-red-600 leading-tight break-all">
            {formatINRShort(expenses)}
          </span>
        </div>

        {/* Net */}
        <div
          className="rounded-2xl p-3 flex flex-col gap-1"
          style={{ background: net >= 0 ? '#f0fdf4' : '#fff1f2' }}
        >
          <span
            className="text-[10px] font-semibold uppercase tracking-wide"
            style={{ color: netColor }}
          >
            {netLabel}
          </span>
          <span className="text-sm font-bold leading-tight break-all" style={{ color: netColor }}>
            {formatINRShort(Math.abs(net))}
          </span>
        </div>
      </div>

      {/* Net Profit/Loss Banner */}
      <div
        className="rounded-2xl px-4 py-3 flex items-center justify-between"
        style={{ background: net >= 0 ? '#dcfce7' : '#fee2e2' }}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: netColor }}>
            {netLabel}
          </p>
          <p className="text-xl font-extrabold mt-0.5" style={{ color: netColor }}>
            {formatINR(Math.abs(net))}
          </p>
        </div>
        <NetIcon size={32} style={{ color: netColor }} strokeWidth={1.5} />
      </div>

      {/* Bar Chart */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Revenue vs Expenses
        </p>
        {revenue === 0 && expenses === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-300 gap-2">
            <span className="text-3xl">📊</span>
            <span className="text-sm">No transactions in this period</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={chartData}
              barCategoryGap="40%"
              margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
            >
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#6B7280' }}
              />
              <YAxis
                tickFormatter={(v) => formatINRShort(v)}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#9CA3AF' }}
                width={50}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={80}>
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Breakdown detail */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
        <div className="px-4 py-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Revenue Breakdown</p>
          {[
            { label: 'Sales', types: ['sale'] },
            { label: 'Receipts', types: ['receipt'] },
          ].map(({ label, types }) => {
            const amt = transactions
              .filter((t) => types.includes(t.type))
              .reduce((s, t) => s + (Number(t.amount) || 0), 0);
            return (
              <div key={label} className="flex justify-between items-center py-1">
                <span className="text-sm text-gray-600">{label}</span>
                <span className="text-sm font-semibold text-blue-700">{formatINR(amt)}</span>
              </div>
            );
          })}
        </div>
        <div className="px-4 py-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Expense Breakdown</p>
          {[
            { label: 'Purchases', types: ['purchase'] },
            { label: 'Expenses',  types: ['expense'] },
            { label: 'Payments',  types: ['payment'] },
          ].map(({ label, types }) => {
            const amt = transactions
              .filter((t) => types.includes(t.type))
              .reduce((s, t) => s + (Number(t.amount) || 0), 0);
            return (
              <div key={label} className="flex justify-between items-center py-1">
                <span className="text-sm text-gray-600">{label}</span>
                <span className="text-sm font-semibold text-red-600">{formatINR(amt)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
