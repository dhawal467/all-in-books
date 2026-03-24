import React, { useState } from 'react';
import TypeSelector from './TypeSelector';
import CategoryChips from './CategoryChips';
import GSTFields from './GSTFields';
import PartyField from './PartyField';
import PhotoAttach from './PhotoAttach';
import { useUiStore } from '../../../stores/uiStore';
import { useTransactionStore } from '../../../stores/transactionStore';
import { formatINR } from '../../../utils/currency';

// Today's date in YYYY-MM-DD format (local)
function todayISO() {
  return new Date().toLocaleDateString('en-CA');
}

export default function EntryForm({ defaultType, onSave }) {
  const { lastUsedType, setLastUsedType, showToast, closeModal } = useUiStore();
  const { add } = useTransactionStore();

  const initialType = defaultType || lastUsedType || 'SALE';

  const [type, setType] = useState(initialType);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayISO);
  const [note, setNote] = useState('');
  const [partyId, setPartyId] = useState(null);
  const [categoryId, setCategoryId] = useState(null);
  const [attachmentId, setAttachmentId] = useState(null);
  const [gstBase, setGstBase] = useState(null);
  const [gstAmount, setGstAmount] = useState(null);
  const [gstRate, setGstRate] = useState(null);
  const [amountError, setAmountError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleTypeChange = (newType) => {
    setType(newType);
    // Reset category when type changes (income/expense may differ)
    setCategoryId(null);
  };

  const handleGSTChange = (base, gst, rate) => {
    setGstBase(base);
    setGstAmount(gst);
    setGstRate(rate);
  };

  const handlePartyChange = (id, name) => {
    setPartyId(id);
  };

  const handleSave = async () => {
    if (isSaving) return;

    const numericAmount = parseFloat(amount);
    if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
      setAmountError('Please enter a valid amount greater than 0.');
      return;
    }
    setAmountError('');

    setIsSaving(true);
    try {
      const entry = {
        type: type.toLowerCase(),
        amount: numericAmount,
        date,
        note: note.trim() || null,
        partyId: partyId || null,
        categoryId: categoryId || null,
        attachmentId: attachmentId || null,
        // GST fields — null when GST is off
        baseAmount: gstBase,
        gstAmount: gstAmount,
        gstRate: gstRate,
      };

      const savedEntry = await add(entry);
      setLastUsedType(type);
      showToast('Entry saved!', 'success');
      onSave?.(savedEntry);
      closeModal('entryForm');
    } catch (err) {
      console.error('Failed to save entry:', err);
      showToast('Failed to save entry. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const numericTotal = parseFloat(amount) || 0;

  return (
    <div className="pb-safe">
      {/* Type Selector */}
      <TypeSelector value={type} onChange={handleTypeChange} />

      {/* Category Chips */}
      <CategoryChips
        activeType={type}
        value={categoryId}
        onChange={setCategoryId}
      />

      {/* Amount Input */}
      <div className="px-4 pb-4">
        <label className="block text-sm font-medium text-primary mb-1">
          Amount (₹)
        </label>
        <div className={`flex items-center bg-[#F4F8FA] border rounded-[12px] overflow-hidden focus-within:ring-1 focus-within:ring-primary ${amountError ? 'border-red-400' : 'border-[#B8D0E8]'}`}>
          <span className="pl-4 text-xl font-semibold text-primary/40">₹</span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              if (amountError) setAmountError('');
            }}
            placeholder="0.00"
            className="flex-1 p-3 bg-transparent text-xl font-semibold text-primary focus:outline-none placeholder-primary/30"
          />
        </div>
        {amountError && (
          <p className="mt-1.5 text-xs text-red-500">{amountError}</p>
        )}
        {numericTotal > 0 && (
          <p className="mt-1 text-xs text-primary/50">{formatINR(numericTotal)}</p>
        )}
      </div>

      {/* GST Fields — passes total for live calculation */}
      <GSTFields total={numericTotal} onGSTChange={handleGSTChange} />

      {/* Date Picker */}
      <div className="px-4 pb-4">
        <label className="block text-sm font-medium text-primary mb-1">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full p-3 bg-[#F4F8FA] border border-[#B8D0E8] rounded-[12px] focus:outline-none focus:ring-1 focus:ring-primary text-primary"
        />
      </div>

      {/* Party Field */}
      <PartyField
        value={partyId}
        onChange={handlePartyChange}
        label="Party / Person"
        required={false}
      />

      {/* Note */}
      <div className="px-4 pb-4">
        <label className="block text-sm font-medium text-primary mb-1">
          Note <span className="text-primary/50 text-xs font-normal ml-1">(Optional)</span>
        </label>
        <textarea
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note..."
          className="w-full p-3 bg-[#F4F8FA] border border-[#B8D0E8] rounded-[12px] focus:outline-none focus:ring-1 focus:ring-primary resize-none text-primary placeholder-primary/40"
        />
      </div>

      {/* Photo Attach */}
      <PhotoAttach onAttach={setAttachmentId} label="Attach Bill / Receipt" />

      {/* Save Button */}
      <div className="px-4 pb-8 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-4 bg-primary text-white rounded-[12px] font-semibold text-base transition-all active:scale-95 disabled:opacity-50 shadow-sm"
        >
          {isSaving ? 'Saving…' : 'Save Entry'}
        </button>
      </div>
    </div>
  );
}
