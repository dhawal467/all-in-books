import React from 'react';
import { formatINR } from '../../utils/currency';
import { Phone } from 'lucide-react';
import { useUiStore } from '../../stores/uiStore';

export default function PartyCard({ party, balance }) {
  const openModal = useUiStore(state => state.openModal);
  // Balance logic: 
  // Positive means they owe us (TO RECEIVE) -> Green
  // Negative means we owe them (TO PAY) -> Red
  // Zero means settled -> Grey
  
  const isToReceive = balance > 0;
  const isToPay = balance < 0;
  
  const colorClass = isToReceive 
    ? 'text-income bg-green-50' 
    : isToPay 
      ? 'text-expense bg-red-50' 
      : 'text-gray-500 bg-gray-50';

  const amountColor = isToReceive 
    ? 'text-income' 
    : isToPay 
      ? 'text-expense' 
      : 'text-gray-600';

  // Absolute value for display since "To Pay/Receive" provides directionality context
  const displayAmount = Math.abs(balance);

  return (
    <div 
      className="bg-white p-4 flex items-center justify-between active:bg-gray-50 transition-colors cursor-pointer"
      onClick={() => openModal('partyStatement', party)}
    >
      <div className="flex flex-col gap-1 overflow-hidden">
        <span className="font-medium text-primary line-clamp-1">{party.name}</span>
        {party.phone && (
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Phone size={10} /> {party.phone}
          </span>
        )}
      </div>
      
      <div className="text-right flex flex-col items-end">
        <span className={`font-semibold ${amountColor}`}>
          {formatINR(displayAmount)}
        </span>
        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${colorClass} mt-1`}>
          {isToReceive ? 'To Receive' : isToPay ? 'To Pay' : 'Settled'}
        </span>
      </div>
    </div>
  );
}
