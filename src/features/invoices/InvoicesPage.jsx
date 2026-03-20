import React, { useEffect, useState } from 'react';
import { Plus, Share2, CheckCircle, FileText } from 'lucide-react';
import { useInvoiceStore } from '../../stores/invoiceStore';
import { usePartyStore } from '../../stores/partyStore';
import { useTransactionStore } from '../../stores/transactionStore';
import { useUiStore } from '../../stores/uiStore';
import InvoiceList from './InvoiceList';
import InvoicePreview from './InvoicePreview';
import { shareInvoice } from '../../services/InvoicePDF';
import Sheet from '../../components/Sheet';
import EmptyState from '../../components/EmptyState';

export default function InvoicesPage() {
  const { invoices, load: loadInvoices } = useInvoiceStore();
  const { parties, load: loadParties } = usePartyStore();
  const { openModal } = useUiStore();

  useEffect(() => {
    loadInvoices();
    loadParties();
  }, [loadInvoices, loadParties]);

  return (
    <div className="flex flex-col h-full bg-gray-50 pb-[100px] relative">
      <div className="flex-1 p-4 space-y-6 overflow-y-auto">
        {invoices.length === 0 ? (
          <div className="mt-8">
            <EmptyState 
              icon={FileText} 
              title="No invoices yet" 
              message="Create your first professional invoice to send to clients." 
              ctaText="Create Invoice"
              onCtaClick={() => openModal('invoiceForm')}
            />
          </div>
        ) : (
          <InvoiceList invoices={invoices} loading={false} />
        )}
      </div>

      {/* Floating Action Button for New Invoice */}
      <button
        onClick={() => openModal('invoiceForm')}
        className="fixed bottom-[88px] right-4 w-14 h-14 bg-accent text-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform z-20"
        aria-label="Create Invoice"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

      {/* Invoice Detail Sheet */}
      <Sheet name="invoiceDetail" title="Invoice Details">
        {(invoice) => <InvoiceDetail invoice={invoice} />}
      </Sheet>
    </div>
  );
}

function InvoiceDetail({ invoice }) {
  const { parties } = usePartyStore();
  const { updateStatus } = useInvoiceStore();
  const { add: addTransaction } = useTransactionStore();
  const { showToast, closeModal } = useUiStore();
  const [isRecording, setIsRecording] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  if (!invoice) return null;

  const party = parties.find(p => p.id === invoice.partyId);
  // Default mock business info if none is stored globally
  const business = { name: 'All in Books', address: 'Bangalore, India' };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      await shareInvoice(invoice, business, party);
    } catch (err) {
      console.error('Share failed', err);
      showToast('Failed to share invoice', 'error');
    } finally {
      setIsSharing(false);
    }
  };

  const handleRecordAsSale = async () => {
    if (invoice.status === 'Recorded') return;
    setIsRecording(true);
    try {
      // 1. Add 'sale' transaction
      await addTransaction({
        type: 'sale',
        amount: invoice.grandTotal,
        partyId: invoice.partyId,
        date: invoice.issueDate,
        note: `Invoice ${invoice.invoiceNumber}`,
      });
      // 2. Update Invoice Status
      await updateStatus(invoice.id, 'Recorded');
      
      showToast('Recorded as Sale!', 'success');
      closeModal('invoiceDetail');
    } catch (err) {
      console.error('Failed to record sale', err);
      showToast('Failed to record. Try again.', 'error');
    } finally {
      setIsRecording(false);
    }
  };

  return (
    <div className="space-y-6 flex flex-col items-center pb-safe">
      {/* Scaled Preview box */}
      <div className="w-full bg-[#f0f4f8] rounded-xl overflow-hidden border border-[#d1e0f0] p-2 flex justify-center shadow-inner relative max-h-[350px] overflow-y-auto">
        {/* Scale the A4 Preview down to roughly fit mobile widths */}
        <div style={{ transform: 'scale(0.35)', transformOrigin: 'top center', width: '794px', height: '1123px', marginBottom: '-730px' }}>
          <InvoicePreview invoice={invoice} party={party} business={business} />
        </div>
      </div>

      {/* Actions */}
      <div className="w-full space-y-3">
        <button
          onClick={handleShare}
          disabled={isSharing}
          className="w-full flex items-center justify-center gap-2 min-h-[50px] px-4 bg-primary text-white rounded-[12px] font-semibold text-base transition-all active:scale-[0.98] disabled:opacity-50"
        >
          <Share2 size={18} />
          {isSharing ? 'Generating PDF...' : 'Share PDF'}
        </button>

        <button
          onClick={handleRecordAsSale}
          disabled={isRecording || invoice.status === 'Recorded'}
          className={`w-full flex items-center justify-center gap-2 min-h-[50px] px-4 rounded-[12px] font-semibold text-base transition-all border-2 ${
            invoice.status === 'Recorded' 
              ? 'bg-green-50 border-green-200 text-green-700 opacity-80 cursor-default' 
              : 'bg-white border-primary/20 text-primary hover:bg-primary/5 active:scale-[0.98]'
          }`}
        >
          <CheckCircle size={18} />
          {invoice.status === 'Recorded' ? 'Sale Recorded' : 'Record as Sale'}
        </button>
      </div>
    </div>
  );
}
