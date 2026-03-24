import React, { useState, useEffect, useMemo, useRef } from 'react';
import { usePartyStore } from '../../stores/partyStore';
import { useUiStore } from '../../stores/uiStore';
import { formatINR } from '../../utils/currency';
import { Share2, Phone, Calendar } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import DOMPurify from 'dompurify';

const sanitize = (str) => DOMPurify.sanitize(str ?? '', { ALLOWED_TAGS: [] });

export default function PartyStatement() {
  const modalState = useUiStore(state => state.modals['partyStatement']);
  const party = modalState?.data;
  
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [statementData, setStatementData] = useState({ party: null, transactions: [] });
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  const getStatement = usePartyStore(state => state.getStatement);
  const showToast = useUiStore(state => state.showToast);
  
  const printRef = useRef(null);

  useEffect(() => {
    if (party?.id) {
      getStatement(party.id, dateRange).then(setStatementData);
    }
  }, [party?.id, dateRange, getStatement]);

  const rows = useMemo(() => {
    if (!statementData.party) return [];

    let currentBalance = statementData.party.openingBalance || 0;
    
    // We expect transactions to be sorted ascending by date from the DB/Store
    // so we process them sequentially for running balance.
    const computedRows = statementData.transactions.map(tx => {
      const isCredit = ['sale', 'receipt'].includes(tx.type); // They owe us (CR) / Inflow
      const isDebit = ['purchase', 'expense', 'payment'].includes(tx.type); // We owe them (DR) / Outflow
      
      const amount = Number(tx.totalAmount || tx.amount) || 0;
      
      if (isCredit) currentBalance += amount;
      if (isDebit) currentBalance -= amount;

      // Fix rounding errors
      currentBalance = Math.round(currentBalance * 100) / 100;

      return {
        ...tx,
        dr: isDebit ? amount : null,
        cr: isCredit ? amount : null,
        balance: currentBalance
      };
    });

    return computedRows;
  }, [statementData]);

  // Overall closing balance logic purely depends on the final state of the sequence
  const closingBalance = rows.length > 0 ? rows[rows.length - 1].balance : (statementData.party?.openingBalance || 0);
  
  const isToReceive = closingBalance > 0;
  const isToPay = closingBalance < 0;

  const handleSharePDF = async () => {
    if (!printRef.current || isGeneratingPdf) return;
    
    try {
      setIsGeneratingPdf(true);
      showToast('Generating PDF...', 'success');

      // Add a brief timeout to let React render any pending states cleanly
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(printRef.current, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // If content flows past one page, handle roughly (simplified logic for standard sets)
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const pdfBlob = pdf.output('blob');
      const sanitizedName = sanitize(party.name).replace(/\s+/g, '_');
      const file = new File([pdfBlob], `${sanitizedName}_Statement.pdf`, { type: 'application/pdf' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${sanitize(party.name)} Statement`,
          text: `Here is the statement for ${sanitize(party.name)}.`
        });
      } else {
        // Fallback for browsers/environments that don't support native sharing
        pdf.save(`${sanitizedName}_Statement.pdf`);
        showToast('PDF downloaded successfully');
      }

    } catch (err) {
      console.error('PDF Generation Error:', err);
      showToast('Failed to generate PDF', 'error');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (!party) return null;

  return (
    <div className="flex flex-col h-full bg-gray-50 pb-[100px]">
      
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-safe">
        
        {/* On-Screen Print Container */}
        <div ref={printRef} className="bg-white p-4">
          
          {/* Statement Header */}
          <div className="border-b border-gray-200 pb-4 mb-4">
            <h2 className="text-xl font-bold text-primary">{sanitize(party.name)}</h2>
            {party.phone && (
              <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
                <Phone size={14} /> {sanitize(party.phone)}
              </p>
            )}
            
            <div className="mt-4 p-4 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
              <span className="text-gray-600 font-medium">Closing Balance</span>
              <div className="text-right">
                <span className={`text-xl font-bold ${
                  isToReceive ? 'text-income' : isToPay ? 'text-expense' : 'text-gray-600'
                }`}>
                  {formatINR(Math.abs(closingBalance))}
                </span>
                <p className="text-xs text-gray-400 font-semibold uppercase">
                  {isToReceive ? 'To Receive' : isToPay ? 'To Pay' : 'Settled'}
                </p>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm relative">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#EBF3FA] text-primary/80 sticky top-0 font-medium z-10">
                <tr>
                  <th className="px-3 py-3 border-b border-gray-200">Date/Desc</th>
                  <th className="px-3 py-3 border-b border-gray-200 text-right">Debit (-)</th>
                  <th className="px-3 py-3 border-b border-gray-200 text-right">Credit (+)</th>
                  <th className="px-3 py-3 border-b border-gray-200 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                
                {/* Opening Balance Row */}
                <tr className="bg-gray-50/50">
                  <td className="px-3 py-3 font-medium text-gray-600">
                    <span className="block text-xs uppercase tracking-wide">Opening Balance</span>
                  </td>
                  <td className="px-3 py-3 text-right text-gray-400">-</td>
                  <td className="px-3 py-3 text-right text-gray-400">-</td>
                  <td className="px-3 py-3 text-right font-medium">
                    {formatINR(Math.abs(statementData.party?.openingBalance || 0))}
                    <span className="text-[10px] ml-1 text-gray-500">
                      {(statementData.party?.openingBalance || 0) >= 0 ? 'CR' : 'DR'}
                    </span>
                  </td>
                </tr>

                {/* Transaction Rows */}
                {rows.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-3">
                      <div className="font-medium">{new Date(tx.date).toLocaleDateString('en-GB')}</div>
                      <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                        {tx.type.toUpperCase()}{tx.note ? ` - ${sanitize(tx.note)}` : ''}
                      </div>
                      {tx.isImported && (
                        <span className="inline-block mt-1 text-[9px] font-bold uppercase bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                          Imported
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right text-expense font-medium">
                      {tx.dr ? formatINR(tx.dr) : '-'}
                    </td>
                    <td className="px-3 py-3 text-right text-income font-medium">
                      {tx.cr ? formatINR(tx.cr) : '-'}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold">
                      {formatINR(Math.abs(tx.balance))}
                      <span className="text-[10px] ml-1 text-gray-500">{tx.balance >= 0 ? 'CR' : 'DR'}</span>
                    </td>
                  </tr>
                ))}

                {rows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-8 text-center text-gray-400">
                      No transactions found for this period
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      </div>

      {/* Floating Filters & Actions Area (Not printed) */}
      <div className="fixed bottom-[80px] left-0 right-0 max-w-md mx-auto px-4 pointer-events-none z-20">
        
        {/* Date Filter Bubble */}
        <div className="flex gap-2 mb-4 pointer-events-auto overflow-x-auto scrollbar-hide">
          <div className="relative flex items-center bg-white shadow-lg rounded-full border border-gray-100 p-1 pl-3">
            <Calendar size={14} className="text-gray-400" />
            <span className="text-xs text-gray-500 mx-2">From:</span>
            <input 
              type="date" 
              value={dateRange.from}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              className="text-xs outline-none bg-transparent max-w-[110px]"
            />
          </div>
          <div className="relative flex items-center bg-white shadow-lg rounded-full border border-gray-100 p-1 pl-3">
            <span className="text-xs text-gray-500 mr-2">To:</span>
            <input 
              type="date" 
              value={dateRange.to}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              className="text-xs outline-none bg-transparent max-w-[110px]"
            />
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleSharePDF}
          disabled={isGeneratingPdf}
          className="w-full flex items-center justify-center gap-2 bg-accent text-white h-14 rounded-xl font-bold shadow-lg pointer-events-auto active:scale-95 transition-transform disabled:opacity-70 disabled:active:scale-100"
        >
          {isGeneratingPdf ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Share2 size={20} /> SHARE PDF
            </>
          )}
        </button>
      </div>
      
    </div>
  );
}
