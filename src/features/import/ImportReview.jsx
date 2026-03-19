import React from 'react';
import { AlertCircle, CheckCircle2, Copy } from 'lucide-react';

export default function ImportReview({ parseResult, onConfirm, onCancel, isCommitting }) {
  const { valid = [], errors = [], duplicates = [] } = parseResult || {};

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Review Import</h2>
        </div>
        
        <div className="p-4 flex gap-3">
          <div className="flex-1 bg-green-50 rounded-xl p-3 text-center border border-green-100">
            <p className="text-[10px] sm:text-xs font-semibold text-green-600 uppercase tracking-wide">Valid</p>
            <p className="text-xl sm:text-2xl font-bold text-green-700">{valid.length}</p>
          </div>
          <div className="flex-1 bg-red-50 rounded-xl p-3 text-center border border-red-100">
            <p className="text-[10px] sm:text-xs font-semibold text-red-600 uppercase tracking-wide">Errors</p>
            <p className="text-xl sm:text-2xl font-bold text-red-700">{errors.length}</p>
          </div>
          <div className="flex-1 bg-amber-50 rounded-xl p-3 text-center border border-amber-100">
            <p className="text-[10px] sm:text-xs font-semibold text-amber-600 uppercase tracking-wide">Dupes</p>
            <p className="text-xl sm:text-2xl font-bold text-amber-700">{duplicates.length}</p>
          </div>
        </div>

        {errors.length > 0 && (
          <div className="px-4 pb-4">
            <h3 className="text-xs font-bold text-red-600 uppercase mb-2 flex items-center gap-1.5"><AlertCircle size={14} /> Issues Found</h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {errors.map((err, idx) => (
                <div key={idx} className="bg-red-50/50 rounded-lg p-3 border border-red-100">
                  <p className="text-xs font-semibold text-red-800 mb-1">Row {err._rowNum} (Date: {err.date || 'Missing'})</p>
                  <ul className="list-disc pl-4 text-xs text-red-600 space-y-0.5 font-medium">
                    {err._errors.map((msg, i) => (
                      <li key={i}>{msg}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {duplicates.length > 0 && (
          <div className="px-4 pb-4">
            <h3 className="text-xs font-bold text-amber-600 uppercase mb-2 flex items-center gap-1.5"><Copy size={14} /> Skipped Duplicates</h3>
            <p className="text-xs text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-100">
              {duplicates.length} {duplicates.length === 1 ? 'row was' : 'rows were'} ignored because identical records exist.
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          disabled={isCommitting}
          className="flex-1 py-3.5 px-3 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={valid.length === 0 || isCommitting}
          className="flex-1 py-3.5 px-3 bg-accent text-white font-semibold rounded-xl hover:bg-accent/90 transition-colors disabled:opacity-50 flex justify-center items-center gap-2 shadow-sm text-sm"
        >
          {isCommitting ? (
            <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin" />
          ) : (
             <CheckCircle2 size={18} />
          )}
          Import {valid.length}
        </button>
      </div>
    </div>
  );
}
