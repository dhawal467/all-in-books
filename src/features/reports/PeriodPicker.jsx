import React, { useState } from 'react';
import { Calendar } from 'lucide-react';

/**
 * Computes YYYY-MM-DD string for a given Date
 */
function toISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returns { from, to } ISO strings for a named preset.
 */
function getPresetRange(preset) {
  const now = new Date();

  if (preset === 'thisweek') {
    const day = now.getDay(); // 0 = Sun
    const diff = (day === 0 ? -6 : 1 - day); // Monday as week start
    const mon = new Date(now);
    mon.setDate(now.getDate() + diff);
    return { from: toISO(mon), to: toISO(now) };
  }

  if (preset === 'thismonth') {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: toISO(from), to: toISO(now) };
  }

  if (preset === 'lastmonth') {
    const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const to   = new Date(now.getFullYear(), now.getMonth(), 0); // last day of prev month
    return { from: toISO(from), to: toISO(to) };
  }

  return null; // custom — caller handles it
}

const PRESETS = [
  { id: 'thisweek',  label: 'This Week' },
  { id: 'thismonth', label: 'This Month' },
  { id: 'lastmonth', label: 'Last Month' },
  { id: 'custom',    label: 'Custom' },
];

/**
 * PeriodPicker
 * Props:
 *   - initialPreset {string} — default 'thismonth'
 *   - onChange({ from, to }) — called whenever the period changes
 */
export default function PeriodPicker({ initialPreset = 'thismonth', onChange }) {
  const [active, setActive] = useState(initialPreset);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo,   setCustomTo]   = useState('');

  function handlePreset(id) {
    setActive(id);
    if (id !== 'custom') {
      const range = getPresetRange(id);
      onChange?.(range);
    }
  }

  function handleCustomFrom(val) {
    setCustomFrom(val);
    if (val && customTo) onChange?.({ from: val, to: customTo });
  }

  function handleCustomTo(val) {
    setCustomTo(val);
    if (customFrom && val) onChange?.({ from: customFrom, to: val });
  }

  return (
    <div className="mb-4">
      {/* Preset buttons */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => handlePreset(p.id)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150
              ${active === p.id
                ? 'bg-accent text-white border-accent shadow-sm'
                : 'bg-white text-primary/70 border-gray-200 hover:border-accent hover:text-accent'
              }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Custom range inputs */}
      {active === 'custom' && (
        <div className="flex items-center gap-2 mt-3">
          <Calendar size={15} className="text-gray-400 shrink-0" />
          <input
            type="date"
            value={customFrom}
            onChange={(e) => handleCustomFrom(e.target.value)}
            className="flex-1 text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-accent"
            aria-label="From date"
          />
          <span className="text-gray-400 text-xs">to</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => handleCustomTo(e.target.value)}
            className="flex-1 text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-accent"
            aria-label="To date"
          />
        </div>
      )}
    </div>
  );
}

// Export the helper so ReportsPage can seed the initial state
export { getPresetRange };
