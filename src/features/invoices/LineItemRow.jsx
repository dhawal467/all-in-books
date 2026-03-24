import React from 'react';
import { Trash2 } from 'lucide-react';
import { formatINR } from '../../utils/currency';

export default function LineItemRow({ item, index, onChange, onRemove, canRemove }) {
  const lineTotal = (Number(item.qty) || 0) * (Number(item.rate) || 0);

  const handleField = (field, value) => {
    onChange(index, { ...item, [field]: value });
  };

  return (
    <div className="bg-[#F4F8FA] border border-[#B8D0E8] rounded-[12px] p-3 space-y-2">
      {/* Row header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-primary/50 uppercase tracking-wider">
          Item {index + 1}
        </span>
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="p-1.5 text-red-400 hover:text-red-600 active:scale-90 transition-all rounded-lg hover:bg-red-50"
            aria-label={`Remove item ${index + 1}`}
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* Description */}
      <input
        type="text"
        value={item.description}
        onChange={(e) => handleField('description', e.target.value)}
        placeholder="Item description"
        className="w-full p-2.5 bg-white border border-[#B8D0E8] rounded-[10px] text-sm text-primary focus:outline-none focus:ring-1 focus:ring-primary placeholder-primary/40"
      />

      {/* HSN and UOM */}
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-[10px] font-medium text-primary/60 uppercase tracking-wider mb-1">HSN Code</label>
          <input
            type="text"
            value={item.hsnCode || ''}
            onChange={(e) => handleField('hsnCode', e.target.value)}
            placeholder="e.g. 60019200"
            className="w-full p-2.5 bg-white border border-[#B8D0E8] rounded-[10px] text-sm text-primary focus:outline-none focus:ring-1 focus:ring-primary placeholder-primary/40"
          />
        </div>
        <div className="flex-1">
          <label className="block text-[10px] font-medium text-primary/60 uppercase tracking-wider mb-1">UOM</label>
          <input
            type="text"
            value={item.uom || ''}
            onChange={(e) => handleField('uom', e.target.value)}
            placeholder="e.g. Nos, Mtr"
            className="w-full p-2.5 bg-white border border-[#B8D0E8] rounded-[10px] text-sm text-primary focus:outline-none focus:ring-1 focus:ring-primary placeholder-primary/40"
          />
        </div>
      </div>

      {/* Qty + Rate + Line Total */}
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="block text-[10px] font-medium text-primary/60 uppercase tracking-wider mb-1">Qty</label>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="1"
            value={item.qty}
            onChange={(e) => handleField('qty', e.target.value)}
            placeholder="1"
            className="w-full p-2.5 bg-white border border-[#B8D0E8] rounded-[10px] text-sm text-primary focus:outline-none focus:ring-1 focus:ring-primary placeholder-primary/40"
          />
        </div>
        <div className="flex-1">
          <label className="block text-[10px] font-medium text-primary/60 uppercase tracking-wider mb-1">Rate (₹)</label>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={item.rate}
            onChange={(e) => handleField('rate', e.target.value)}
            placeholder="0.00"
            className="w-full p-2.5 bg-white border border-[#B8D0E8] rounded-[10px] text-sm text-primary focus:outline-none focus:ring-1 focus:ring-primary placeholder-primary/40"
          />
        </div>
        <div className="flex-1">
          <label className="block text-[10px] font-medium text-primary/60 uppercase tracking-wider mb-1">Total</label>
          <div className="p-2.5 bg-primary/5 border border-transparent rounded-[10px] text-sm font-semibold text-primary text-right">
            {formatINR(lineTotal)}
          </div>
        </div>
      </div>
    </div>
  );
}
