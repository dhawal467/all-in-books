import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePartyStore } from '../../stores/partyStore';
import { useTransactionStore } from '../../stores/transactionStore';
import { ArrowRight } from 'lucide-react';

export default function OutstandingStrip() {
  const navigate = useNavigate();
  const parties = usePartyStore(state => state.parties);
  const transactions = useTransactionStore(state => state.transactions);
  
  const [totals, setTotals] = useState({
    receiveTotal: 0, receiveCount: 0,
    payTotal: 0, payCount: 0
  });

  useEffect(() => {
    usePartyStore.getState().load();
    useTransactionStore.getState().load();
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    const fetchTotals = async () => {
      let rTotal = 0;
      let rCount = 0;
      let pTotal = 0;
      let pCount = 0;

      const getPartyBalance = useTransactionStore.getState().getPartyBalance;

      for (const p of parties) {
        const txBalance = await getPartyBalance(p.id);
        const bal = (Number(p.openingBalance) || 0) + txBalance;
        const cleanBal = Math.round(bal * 100) / 100;
        
        if (cleanBal > 0) {
          rTotal += cleanBal;
          rCount++;
        } else if (cleanBal < 0) {
          pTotal += Math.abs(cleanBal);
          pCount++;
        }
      }

      if (isMounted) {
        setTotals({
          receiveTotal: rTotal,
          receiveCount: rCount,
          payTotal: pTotal,
          payCount: pCount
        });
      }
    };

    fetchTotals();

    return () => { isMounted = false; };
  }, [parties, transactions]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
      {/* To Receive */}
      <div 
        onClick={() => navigate('/parties')}
        className="flex items-center justify-between p-4 border-b border-gray-100 active:bg-gray-50 transition-colors cursor-pointer"
      >
        <div>
          <h3 className="text-sm font-bold text-gray-900">To Receive</h3>
          <p className="text-xs font-medium text-gray-500 mt-1">{totals.receiveCount} parties</p>
        </div>
        <div className="flex items-center space-x-1">
          <span className="text-lg font-bold text-green-600 mr-1">
            ₹{totals.receiveTotal.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </span>
          <ArrowRight size={18} className="text-gray-400" />
        </div>
      </div>

      {/* To Pay */}
      <div 
        onClick={() => navigate('/parties')}
        className="flex items-center justify-between p-4 active:bg-gray-50 transition-colors cursor-pointer"
      >
        <div>
          <h3 className="text-sm font-bold text-gray-900">To Pay</h3>
          <p className="text-xs font-medium text-gray-500 mt-1">{totals.payCount} parties</p>
        </div>
        <div className="flex items-center space-x-1">
          <span className="text-lg font-bold text-red-600 mr-1">
            ₹{totals.payTotal.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </span>
          <ArrowRight size={18} className="text-gray-400" />
        </div>
      </div>
    </div>
  );
}
