import React, { useState, useEffect, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useInvoiceStore } from '../../stores/invoiceStore';
import { useUiStore } from '../../stores/uiStore';
import PartyField from '../entries/EntryForm/PartyField';
import LineItemRow from './LineItemRow';
import { calcFromBase } from '../../utils/gst';
import { formatINR } from '../../utils/currency';
import { generateUUID } from '../../utils/uuid';

const GST_RATES = [0, 5, 12, 18, 28];

function todayISO() {
  return new Date().toLocaleDateString('en-CA');
}

function createBlankItem() {
  return { id: generateUUID(), description: '', hsnCode: '', uom: 'Nos', qty: '1', rate: '' };
}

export default function InvoiceForm({ onSave }) {
  const { add, getNextInvoiceNumber } = useInvoiceStore();
  const { showToast, closeModal } = useUiStore();

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [partyId, setPartyId] = useState(null);
  const [issueDate, setIssueDate] = useState(todayISO);
  const [lineItems, setLineItems] = useState([createBlankItem()]);
  const [gstEnabled, setGstEnabled] = useState(false);
  const [gstRate, setGstRate] = useState(18);
  const [discount, setDiscount] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Auto-generate invoice number on mount
  useEffect(() => {
    getNextInvoiceNumber().then(setInvoiceNumber);
  }, [getNextInvoiceNumber]);

  // ── Computed Totals ──
  const subtotal = useMemo(() => {
    return lineItems.reduce((sum, item) => {
      return sum + (Number(item.qty) || 0) * (Number(item.rate) || 0);
    }, 0);
  }, [lineItems]);

  const gstAmount = useMemo(() => {
    if (!gstEnabled || gstRate === 0) return 0;
    return calcFromBase(subtotal, gstRate).gstAmount;
  }, [subtotal, gstEnabled, gstRate]);

  const discountNum = Number(discount) || 0;
  const grandTotal = Math.max(0, subtotal + gstAmount - discountNum);

  // ── Line Item Handlers ──
  const handleItemChange = (index, updatedItem) => {
    setLineItems((prev) => prev.map((item, i) => (i === index ? updatedItem : item)));
  };

  const handleItemRemove = (index) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddItem = () => {
    setLineItems((prev) => [...prev, createBlankItem()]);
  };

  // ── Party Handler ──
  const handlePartyChange = (id) => {
    setPartyId(id);
    if (errors.partyId) setErrors((e) => ({ ...e, partyId: null }));
  };

  // ── Validation & Save ──
  const handleSave = async () => {
    const newErrors = {};

    if (!partyId) {
      newErrors.partyId = 'Please select a party.';
    }

    // Validate line items
    const validItems = lineItems.filter(
      (item) => item.description.trim() && Number(item.qty) > 0 && Number(item.rate) > 0
    );
    if (validItems.length === 0) {
      newErrors.lineItems = 'Add at least one item with description, quantity, and rate.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSaving(true);

    try {
      const finalLineItems = validItems.map((item) => ({
        description: item.description.trim(),
        hsnCode: item.hsnCode?.trim() || '',
        uom: item.uom?.trim() || 'Nos',
        qty: Number(item.qty),
        rate: Number(item.rate),
        lineTotal: Math.round(Number(item.qty) * Number(item.rate) * 100) / 100,
      }));

      const invoice = {
        invoiceNumber,
        partyId,
        issueDate,
        lineItems: finalLineItems,
        subtotal: Math.round(subtotal * 100) / 100,
        gstRate: gstEnabled ? gstRate : null,
        gstAmount: gstEnabled ? Math.round(gstAmount * 100) / 100 : null,
        discount: Math.round(discountNum * 100) / 100,
        grandTotal: Math.round(grandTotal * 100) / 100,
        status: 'draft',
        createdAt: Date.now(),
      };

      const invoiceId = await add(invoice);
      showToast('Invoice saved!', 'success');
      onSave?.(invoiceId);
      closeModal('invoiceForm');
    } catch (err) {
      console.error('Failed to save invoice:', err);
      showToast('Failed to save invoice. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="pb-safe">
      {/* Invoice Number (editable) */}
      <div className="px-4 pb-4">
        <label className="block text-sm font-medium text-primary mb-1">Invoice #</label>
        <input
          type="text"
          value={invoiceNumber || ''}
          onChange={(e) => setInvoiceNumber(e.target.value)}
          className="w-full p-3 bg-[#F4F8FA] border border-[#B8D0E8] rounded-[12px] focus:outline-none focus:ring-1 focus:ring-primary text-primary font-semibold"
          placeholder="e.g. AIB-0001"
        />
      </div>

      {/* Party Selector */}
      <PartyField
        value={partyId}
        onChange={handlePartyChange}
        label="Bill To (Party)"
        required
      />
      {errors.partyId && (
        <p className="px-4 -mt-2 mb-3 text-xs text-red-500">{errors.partyId}</p>
      )}

      {/* Invoice Date */}
      <div className="px-4 pb-4">
        <label className="block text-sm font-medium text-primary mb-1">Invoice Date</label>
        <input
          type="date"
          value={issueDate}
          onChange={(e) => setIssueDate(e.target.value)}
          className="w-full p-3 bg-[#F4F8FA] border border-[#B8D0E8] rounded-[12px] focus:outline-none focus:ring-1 focus:ring-primary text-primary"
        />
      </div>

      {/* ── Line Items ── */}
      <div className="px-4 pb-2">
        <h3 className="text-sm font-bold text-primary mb-2 uppercase tracking-wider">Line Items</h3>
      </div>
      <div className="px-4 space-y-3 pb-3">
        {lineItems.map((item, index) => (
          <LineItemRow
            key={item.id}
            item={item}
            index={index}
            onChange={handleItemChange}
            onRemove={handleItemRemove}
            canRemove={lineItems.length > 1}
          />
        ))}
      </div>

      {/* Add Item Button */}
      <div className="px-4 pb-4">
        <button
          type="button"
          onClick={handleAddItem}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-primary/20 rounded-[12px] text-sm font-semibold text-primary/60 hover:border-primary/40 hover:text-primary/80 active:scale-[0.98] transition-all"
        >
          <Plus size={18} /> Add Item
        </button>
      </div>
      {errors.lineItems && (
        <p className="px-4 -mt-2 mb-3 text-xs text-red-500">{errors.lineItems}</p>
      )}

      {/* ── GST Toggle ── */}
      <div className="px-4 pb-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-primary">GST</span>
          <button
            type="button"
            role="switch"
            aria-checked={gstEnabled}
            onClick={() => setGstEnabled((prev) => !prev)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
              gstEnabled ? 'bg-primary' : 'bg-primary/20'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${
                gstEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {gstEnabled && (
          <div className="flex gap-2 flex-wrap">
            {GST_RATES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setGstRate(r)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  gstRate === r
                    ? 'bg-primary text-white'
                    : 'bg-primary/10 text-primary hover:bg-primary/20'
                }`}
              >
                {r}%
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Discount ── */}
      <div className="px-4 pb-4">
        <label className="block text-sm font-medium text-primary mb-1">
          Discount (₹) <span className="text-primary/50 text-xs font-normal ml-1">(Optional)</span>
        </label>
        <div className="flex items-center bg-[#F4F8FA] border border-[#B8D0E8] rounded-[12px] overflow-hidden focus-within:ring-1 focus-within:ring-primary">
          <span className="pl-4 text-lg font-semibold text-primary/40">₹</span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            placeholder="0.00"
            className="flex-1 p-3 bg-transparent text-sm font-semibold text-primary focus:outline-none placeholder-primary/30"
          />
        </div>
      </div>

      {/* ── Totals Summary ── */}
      <div className="px-4 pb-4">
        <div className="bg-primary/5 rounded-[12px] px-4 py-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-primary/60">Subtotal</span>
            <span className="font-semibold text-primary">{formatINR(subtotal)}</span>
          </div>
          {gstEnabled && gstRate > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-primary/60">GST ({gstRate}%)</span>
              <span className="font-semibold text-primary">+ {formatINR(gstAmount)}</span>
            </div>
          )}
          {discountNum > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-primary/60">Discount</span>
              <span className="font-semibold text-red-500">- {formatINR(discountNum)}</span>
            </div>
          )}
          <div className="border-t border-primary/10 pt-2 flex justify-between">
            <span className="text-sm font-bold text-primary">Grand Total</span>
            <span className="text-base font-bold text-primary">{formatINR(grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* ── Save Button ── */}
      <div className="px-4 pb-8 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-4 bg-primary text-white rounded-[12px] font-semibold text-base transition-all active:scale-95 disabled:opacity-50 shadow-sm"
        >
          {isSaving ? 'Saving…' : 'Save Invoice'}
        </button>
      </div>
    </div>
  );
}
