import React from 'react';

const TYPES = ['SALE', 'PURCHASE', 'EXPENSE', 'RECEIPT', 'PAYMENT'];

export default function TypeSelector({ value, onChange }) {
  return (
    <div className="flex overflow-x-auto gap-2 p-4 no-scrollbar">
      {TYPES.map((type) => (
        <button
          key={type}
          onClick={() => onChange(type)}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            value === type
              ? 'bg-primary text-white'
              : 'bg-primary/10 text-primary hover:bg-primary/20'
          }`}
        >
          {type}
        </button>
      ))}
    </div>
  );
}
