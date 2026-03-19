import React, { useMemo, useEffect } from 'react';
import { useTransactionStore } from '../../stores/transactionStore';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';

export default function WeekChart() {
  const transactions = useTransactionStore((state) => state.transactions);

  useEffect(() => {
    useTransactionStore.getState().load();
  }, []);

  const { chartData, totalIncome, totalExpense } = useMemo(() => {
    const today = new Date();
    // Normalize today to start of day in local time
    today.setHours(0, 0, 0, 0);

    const daysMap = new Map();
    const dataList = [];
    
    // Create the last 7 days (from 6 days ago to today)
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      
      const dateStr = d.toLocaleDateString('en-CA'); // YYYY-MM-DD
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      
      const dayData = {
        name: dayName,
        dateStr: dateStr,
        income: 0,
        expense: 0,
      };
      
      // Store in map for O(1) lookup
      daysMap.set(dateStr, dayData);
      dataList.push(dayData);
    }

    let incomeSum = 0;
    let expenseSum = 0;

    transactions.forEach(t => {
      const dayData = daysMap.get(t.date);
      if (dayData) {
        const amt = Number(t.totalAmount || t.amount) || 0;
        
        if (['sale', 'receipt'].includes(t.type)) {
          dayData.income += amt;
          incomeSum += amt;
        } else if (['purchase', 'expense', 'payment'].includes(t.type)) {
          dayData.expense -= amt; // Mirrors below axis in recharts
          expenseSum += amt;      // But keep total scalar as positive
        }
      }
    });

    return { chartData: dataList, totalIncome: incomeSum, totalExpense: expenseSum };
  }, [transactions]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#9ca3af' }} 
              dy={10}
            />
            <YAxis hide={true} />
            <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" fill="#ef4444" radius={[0, 0, 4, 4]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100 text-center">
        <p className="text-sm font-medium text-gray-600">
          This Week: Income <span className="font-bold text-green-600">₹{totalIncome.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span> Expense <span className="font-bold text-red-600">₹{totalExpense.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
        </p>
      </div>
    </div>
  );
}
