import React, { useState } from 'react';
import { usePartyStore } from '../../stores/partyStore';
import { useUiStore } from '../../stores/uiStore';
import { Save, User, Phone, MapPin, Building2 } from 'lucide-react';

export default function PartyForm() {
  const { add } = usePartyStore();
  const { closeModal, showToast } = useUiStore();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    gstin: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      setLoading(true);
      await add({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        gstin: formData.gstin.trim(),
        openingBalance: 0
      });
      showToast('Party saved successfully');
      closeModal('partyForm');
    } catch (error) {
      console.error('Failed to save party', error);
      showToast('Error saving party', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 pb-safe">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* Name Box */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
            <User size={16} /> Party Name <span className="text-expense">*</span>
          </label>
          <input
            type="text"
            name="name"
            placeholder="e.g. Ramesh Suppliers"
            value={formData.name}
            onChange={handleChange}
            className="w-full text-lg border-b border-gray-300 focus:border-accent font-medium pb-2 bg-transparent outline-none transition-colors"
            autoFocus
          />
        </div>

        {/* Details Box */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <Phone size={16} /> Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              placeholder="+91"
              value={formData.phone}
              onChange={handleChange}
              className="w-full min-h-[44px] bg-gray-50 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <MapPin size={16} /> Address
            </label>
            <textarea
              name="address"
              rows={2}
              placeholder="Full address here..."
              value={formData.address}
              onChange={handleChange}
              className="w-full bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-accent resize-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <Building2 size={16} /> GSTIN
            </label>
            <input
              type="text"
              name="gstin"
              placeholder="e.g. 27AAAAA0000A1Z5"
              value={formData.gstin}
              onChange={handleChange}
              className="w-full min-h-[44px] bg-gray-50 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-accent uppercase"
            />
          </div>
        </div>
      </div>

      <div className="p-4 bg-white border-t border-gray-200 shrink-0">
        <button
          onClick={handleSubmit}
          disabled={!formData.name.trim() || loading}
          className={`flex items-center justify-center gap-2 w-full min-h-[48px] rounded-xl font-bold tracking-wide transition-colors ${
            !formData.name.trim() || loading
              ? 'bg-gray-200 text-gray-400'
              : 'bg-accent text-white active:bg-blue-700'
          }`}
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Save size={20} />
              SAVE PARTY
            </>
          )}
        </button>
      </div>
    </div>
  );
}
