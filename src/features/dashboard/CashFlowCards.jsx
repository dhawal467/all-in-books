import React, { useEffect, useState } from 'react';
import { useTransactionStore } from '../../stores/transactionStore';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function CashFlowCards() {
  const transactions = useTransactionStore(state => state.transactions);
  const getTodaySummary = useTransactionStore(state => state.getTodaySummary);

  const [summary, setSummary] = useState({ totalIn: 0, totalOut: 0, net: 0 });

  useEffect(() => {
    // Ensure we trigger a load at least once to populate the array if empty
    useTransactionStore.getState().load();
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    const fetchSummary = async () => {
      const data = await getTodaySummary();
      if (isMounted) {
        setSummary(data);
      }
    };

    fetchSummary();

    return () => { isMounted = false; };
  }, [transactions, getTodaySummary]);

  const isNetPositive = summary.net >= 0;

  return (
    <div className="space-y-4 mb-6">
      <div className="grid grid-cols-2 gap-4">
        {/* IN Card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col items-center justify-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-green-50 text-green-500 flex items-center justify-center">
            <TrendingUp size={20} strokeWidth={2.5} />
          </div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">In</span>
          <span className="text-xl font-bold text-gray-900">
            ₹{summary.totalIn.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* OUT Card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col items-center justify-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center">
            <TrendingDown size={20} strokeWidth={2.5} />
          </div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Out</span>
          <span className="text-xl font-bold text-gray-900">
            ₹{summary.totalOut.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Net Today */}
      <div className="text-center bg-white rounded-xl py-3 px-4 shadow-sm border border-gray-100 flex items-center justify-center">
        <span className="text-sm font-medium text-gray-500">Net Today: </span>
        <span className={`text-sm font-bold ml-2 ${isNetPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isNetPositive ? '+' : '-'}₹{Math.abs(summary.net).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  );
}
