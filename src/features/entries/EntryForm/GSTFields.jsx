import React, { useState, useEffect } from 'react';
import { calcFromTotal } from '../../../utils/gst';
import { formatINR } from '../../../utils/currency';

const GST_RATES = [0, 5, 12, 18, 28];

export default function GSTFields({ total, onGSTChange }) {
  const [enabled, setEnabled] = useState(false);
  const [rate, setRate] = useState(18);

  // Re-calculate and emit whenever total, enabled state, or rate changes
  useEffect(() => {
    if (!enabled) {
      onGSTChange(null, null, null);
      return;
    }

    const numericTotal = Number(total) || 0;
    const { baseAmount, gstAmount } = calcFromTotal(numericTotal, rate);
    onGSTChange(baseAmount, gstAmount, rate);
  }, [enabled, rate, total]);

  const handleToggle = () => {
    setEnabled((prev) => !prev);
  };

  const handleRateSelect = (selectedRate) => {
    setRate(selectedRate);
  };

  // Only compute display values when toggle is on
  const numericTotal = Number(total) || 0;
  const { baseAmount, gstAmount } = enabled
    ? calcFromTotal(numericTotal, rate)
    : { baseAmount: 0, gstAmount: 0 };

  return (
    <div className="px-4 pb-4 space-y-3">
      {/* Toggle row */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-primary">GST</span>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={handleToggle}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
            enabled ? 'bg-primary' : 'bg-primary/20'
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${
              enabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Rate chips + breakdown - only visible when enabled */}
      {enabled && (
        <div className="space-y-3">
          {/* Rate chips */}
          <div className="flex gap-2 flex-wrap">
            {GST_RATES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => handleRateSelect(r)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  rate === r
                    ? 'bg-primary text-white'
                    : 'bg-primary/10 text-primary hover:bg-primary/20'
                }`}
              >
                {r}%
              </button>
            ))}
          </div>

          {/* Read-only breakdown */}
          <div className="flex gap-4 bg-primary/5 rounded-[12px] px-4 py-3">
            <div className="flex-1">
              <p className="text-xs text-primary/60 mb-0.5">Base</p>
              <p className="text-sm font-semibold text-primary">
                {formatINR(baseAmount)}
              </p>
            </div>
            <div className="w-px bg-primary/10" />
            <div className="flex-1">
              <p className="text-xs text-primary/60 mb-0.5">GST ({rate}%)</p>
              <p className="text-sm font-semibold text-primary">
                {formatINR(gstAmount)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
