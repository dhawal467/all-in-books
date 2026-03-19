import React, { useState } from 'react';
import { CheckCircle, RotateCcw } from 'lucide-react';

export default function ImportSummary({ batchId, rowCount, onDone, onUndo }) {
  const [isUndoing, setIsUndoing] = useState(false);
  const [hasUndone, setHasUndone] = useState(false);

  const handleUndo = async () => {
    try {
      setIsUndoing(true);
      await onUndo(batchId);
      setHasUndone(true);
    } catch (err) {
      console.error('Undo failed:', err);
    } finally {
      setIsUndoing(false);
    }
  };

  if (hasUndone) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center mb-4">
          <RotateCcw size={32} />
        </div>
        <h2 className="text-lg font-bold text-gray-800 mb-2">Import Reverted</h2>
        <p className="text-sm text-gray-500 mb-6">
          The {rowCount} imported rows have been completely removed from your records.
        </p>
        <button
          onClick={onDone}
          className="w-full bg-accent text-white font-semibold py-3 px-4 rounded-xl hover:bg-accent/90 transition-colors shadow-sm"
        >
          Return to Imports
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
      <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-4">
        <CheckCircle size={32} />
      </div>
      <h2 className="text-lg font-bold text-gray-800 mb-2">Import Successful</h2>
      <p className="text-sm text-gray-500 mb-6 max-w-xs">
        Successfully imported {rowCount} valid {rowCount === 1 ? 'row' : 'rows'} into your records.
      </p>
      
      <div className="w-full space-y-3">
        <button
          onClick={onDone}
          className="w-full bg-accent text-white font-semibold py-3 px-4 rounded-xl hover:bg-accent/90 transition-colors shadow-sm"
        >
          Done
        </button>
        <button
          onClick={handleUndo}
          disabled={isUndoing}
          className="w-full flex justify-center items-center gap-2 py-3 px-4 bg-white border border-red-100 text-red-600 font-semibold rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          {isUndoing ? (
            <div className="w-4 h-4 border-2 border-red-600 rounded-full border-t-transparent animate-spin" />
          ) : (
             <RotateCcw size={18} />
          )}
          Undo Import
        </button>
      </div>
    </div>
  );
}
