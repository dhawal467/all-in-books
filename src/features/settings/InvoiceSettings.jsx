import React, { useState, useEffect } from 'react';
import { useUiStore } from '../../stores/uiStore';

export default function InvoiceSettings() {
  const { showToast } = useUiStore();
  const [details, setDetails] = useState({
    name: '',
    address: '',
    phone: '',
    gstin: ''
  });

  useEffect(() => {
    const saved = localStorage.getItem('businessDetails');
    if (saved) {
      try {
        setDetails(JSON.parse(saved));
      } catch (e) {
        // ignore JSON parse error
      }
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    localStorage.setItem('businessDetails', JSON.stringify(details));
    showToast('Business details saved', 'success');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mt-4">
      <h2 className="text-base font-semibold text-primary mb-1">Business Details</h2>
      <p className="text-xs text-gray-500 mb-4">Shown on your printed invoices</p>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Business Name</label>
          <input
            type="text"
            name="name"
            value={details.name}
            onChange={handleChange}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent focus:bg-white transition-colors"
            placeholder="e.g. Ramesh Traders"
          />
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Full Address</label>
          <textarea
            name="address"
            value={details.address}
            onChange={handleChange}
            rows={2}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent focus:bg-white transition-colors resize-none"
            placeholder="e.g. 123 Main Street, City"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
            <input
              type="text"
              name="phone"
              value={details.phone}
              onChange={handleChange}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent focus:bg-white transition-colors"
              placeholder="+91..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">GSTIN</label>
            <input
              type="text"
              name="gstin"
              value={details.gstin}
              onChange={handleChange}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent focus:bg-white transition-colors uppercase"
              placeholder="e.g. 29ABCDE1234F1Z5"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full py-3 px-4 bg-primary text-white rounded-lg font-medium active:scale-[0.98] transition-all hover:bg-primary/90 mt-2"
        >
          Save Details
        </button>
      </div>
    </div>
  );
}
