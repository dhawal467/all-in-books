import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useTransactionStore } from '../stores/transactionStore';
import { usePartyStore } from '../stores/partyStore';
import { getLastExportHash } from '../utils/integrity';

export default function IntegrityWarning() {
  const txWarning = useTransactionStore(state => state.integrityWarning);
  const partyWarning = usePartyStore(state => state.integrityWarning);
  const lastExport = getLastExportHash();
  
  const showWarning = txWarning || partyWarning;
  
  if (!showWarning) return null;
  
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-start gap-2">
      <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
      <div className="text-xs text-amber-800">
        <p className="font-semibold">Data Integrity Warning</p>
        <p>
          Some financial records may have been modified outside the app.
          {!lastExport && ' Export data to verify integrity.'}
          {lastExport && ' Last verified export was before potential tampering.'}
        </p>
      </div>
    </div>
  );
}
