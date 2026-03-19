import React, { useState } from 'react';
import { Download } from 'lucide-react';
import PeriodPicker, { getPresetRange } from './PeriodPicker';
import ProfitLoss from './ProfitLoss';
import GSTSummary from './GSTSummary';
import BalanceSheet from './BalanceSheet';
import ExportService from '../../services/ExportService';

const TABS = [
  { id: 'pl',      label: 'P & L' },
  { id: 'gst',     label: 'GST' },
  { id: 'balance', label: 'Balance Sheet' },
];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('pl');

  // Seed initial period to "This Month"
  const [period, setPeriod] = useState(() => getPresetRange('thismonth'));
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const buffer = await ExportService.generate('main');
      ExportService.downloadNow(buffer, 'AllInBooks_Export.xlsx');
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-[100px]">
      {/* Page header */}
      <div className="px-4 pt-3 pb-1 flex justify-between items-center">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Reports</p>
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="flex items-center gap-1.5 text-xs font-semibold text-accent bg-accent/10 px-3 py-1.5 rounded-full hover:bg-accent/20 transition-colors disabled:opacity-50"
        >
          {isExporting ? (
            <div className="w-3.5 h-3.5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          ) : (
            <Download size={14} />
          )}
          {isExporting ? 'Exporting...' : 'Export .xlsx'}
        </button>
      </div>

      <div className="px-4 pt-2 space-y-4">
        {/* Period Picker — hidden for Balance Sheet (all-time snapshot) */}
        {activeTab !== 'balance' && (
          <PeriodPicker
            initialPreset="thismonth"
            onChange={setPeriod}
          />
        )}

        {/* Tab selector */}
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200
                ${activeTab === tab.id
                  ? 'bg-white text-accent shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'pl' && period.from && period.to && (
          <ProfitLoss from={period.from} to={period.to} />
        )}

        {activeTab === 'gst' && period.from && period.to && (
          <GSTSummary from={period.from} to={period.to} />
        )}

        {activeTab === 'balance' && (
          <BalanceSheet />
        )}
      </div>
    </div>
  );
}
