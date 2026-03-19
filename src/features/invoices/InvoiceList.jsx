import React from 'react';
import { usePartyStore } from '../../stores/partyStore';
import { useUiStore } from '../../stores/uiStore';
import { formatINR } from '../../utils/currency';
import { FileText, ArrowRight } from 'lucide-react';
import EmptyState from '../../components/EmptyState';

export default function InvoiceList({ invoices, loading }) {
  const { parties } = usePartyStore();
  const { openModal } = useUiStore();

  if (loading) {
    return <div className="p-4 text-center text-primary/60 text-sm">Loading...</div>;
  }

  if (!invoices || invoices.length === 0) {
    return (
      <div className="mt-12 px-4">
        <EmptyState
          icon={FileText}
          title="No invoices yet"
          message="Create your first invoice to bill a customer."
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[12px] border border-gray-100 shadow-sm overflow-hidden">
      <div className="divide-y divide-gray-100 pb-[100px]">
        {invoices.map((inv) => {
          const party = parties.find((p) => p.id === inv.partyId);
          const partyName = party ? party.name : 'Unknown Party';

          return (
            <div
              key={inv.id}
              className="flex items-center justify-between px-4 py-3 active:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => openModal('invoiceDetail', inv)}
            >
              <div className="flex flex-col gap-1 min-w-0 mr-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-gray-900 truncate">{partyName}</span>
                  <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                      inv.status === 'Recorded' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {inv.status || 'draft'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium">
                  <span>{inv.invoiceNumber}</span>
                  <span>•</span>
                  <span>{inv.issueDate}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm font-semibold whitespace-nowrap text-primary">
                  {formatINR(inv.grandTotal)}
                </span>
                <ArrowRight size={16} className="text-gray-400" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
