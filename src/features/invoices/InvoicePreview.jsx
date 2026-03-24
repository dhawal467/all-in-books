import React from 'react';
import DOMPurify from 'dompurify';
import { formatINR } from '../../utils/currency';
import { numberToWords } from '../../utils/numberToWords';

const sanitize = (str) => DOMPurify.sanitize(str ?? '', { ALLOWED_TAGS: [] });

export default function InvoicePreview({ invoice, business, party }) {
  if (!invoice) return <div style={{ padding: '20px' }}>No invoice data provided.</div>;

  const safeBusiness = business || { name: 'Your Business Name', address: '', phone: '', gstin: '', bankName: '', bankAccount: '', bankIfsc: '' };
  const safeParty = party || { name: 'Unknown Party', address: '', gstin: '' };
  const lineItems = invoice.lineItems || [];

  const totalWords = invoice.grandTotal ? numberToWords(Math.floor(invoice.grandTotal)) : '';
  const totalQty = lineItems.reduce((acc, item) => acc + (Number(item.qty) || 0), 0);

  const cgstRate = invoice.gstRate ? invoice.gstRate / 2 : 0;
  const sgstRate = invoice.gstRate ? invoice.gstRate / 2 : 0;
  const cgstAmount = invoice.gstAmount ? invoice.gstAmount / 2 : 0;
  const sgstAmount = invoice.gstAmount ? invoice.gstAmount / 2 : 0;

  // Render the template inside an A4 container box, similar to Stitch
  return (
    <div
      className="a4-container mx-auto bg-white border border-gray-200 text-[#1A1A1A] text-[11px] leading-snug"
      style={{
        width: '210mm',
        minHeight: '297mm',
        padding: '10mm',
        boxSizing: 'border-box',
        fontFamily: "'Work Sans', sans-serif"
      }}
    >
      <style dangerouslySetInnerHTML={{__html: `
        .invoice-table th, .invoice-table td {
          border: 1px solid #1A1A1A;
          padding: 4px 6px;
        }
        .text-xxs { font-size: 9px; }
      `}} />

      {/* Header Section */}
      <header className="border-t border-l border-r border-[#1A1A1A] text-center py-2 relative">
        <h1 className="text-xl font-bold uppercase tracking-tight">{sanitize(safeBusiness.name)}</h1>
        <p className="font-semibold">{sanitize(safeBusiness.address)}</p>
        <p className="font-semibold">Tel: {sanitize(safeBusiness.phone)}</p>
        <p className="font-bold border-b border-t border-transparent" style={{ borderColor: 'transparent' }}>
          GSTIN: {sanitize(safeBusiness.gstin || '')}
        </p>
        <div className="absolute right-4 top-4 text-xxs font-bold italic">Original for Recipient</div>
      </header>

      {/* Invoice Title */}
      <div className="border border-[#1A1A1A] text-center py-1 bg-white">
        <h2 className="text-xl font-black uppercase tracking-widest">Tax Invoice</h2>
      </div>

      {/* Invoice Meta Data */}
      <div className="grid grid-cols-2">
        <div className="border-l border-b border-[#1A1A1A]">
          <div className="grid grid-cols-1 divide-y divide-[#1A1A1A]">
            <div className="p-1 px-2 font-bold flex justify-between">
              <span>Invoice No: {invoice.invoiceNumber || '—'}</span>
            </div>
            <div className="p-1 px-2 font-bold">
              Invoice date: {invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString('en-GB') : '—'}
            </div>
            <div className="p-1 px-2 flex">
              <span className="flex-grow">.</span>
              <span className="border-l border-[#1A1A1A] px-4 font-bold">Code</span>
              <span className="border-l border-[#1A1A1A] px-4 font-bold">08</span>
            </div>
          </div>
        </div>
        <div className="border-l border-r border-b border-[#1A1A1A]">
          <div className="grid grid-cols-1 divide-y divide-[#1A1A1A]">
            <div className="p-1 px-2 font-bold text-xs opacity-0">Transport Mode:</div>
            <div className="p-1 px-2 font-bold text-xs opacity-0">Vehicle No.:</div>
            <div className="p-1 px-2 font-bold text-xs opacity-0">E-Way Bill No.:</div>
          </div>
        </div>
      </div>

      {/* Billing and Shipping Party */}
      <div className="grid grid-cols-2">
        {/* Bill to */}
        <div className="border-l border-b border-[#1A1A1A]">
          <div className="bg-gray-50 border-b border-[#1A1A1A] text-center font-bold py-1">Bill to Party</div>
          <div className="p-2 space-y-1">
            <p className="font-bold">Name: {sanitize(safeParty.name)}</p>
            <p>Address: <span className="whitespace-pre-wrap">{sanitize(safeParty.address)}</span></p>
            {safeParty.phone && <p>Phone: {sanitize(safeParty.phone)}</p>}
            {safeParty.gstin && <p className="font-bold">GSTIN: {sanitize(safeParty.gstin)}</p>}
          </div>
          <div className="border-t border-[#1A1A1A] flex mt-auto">
            <span className="flex-grow px-2 py-1">.</span>
            <span className="border-l border-[#1A1A1A] px-4 py-1 font-bold">Code</span>
            <span className="border-l border-[#1A1A1A] px-4 py-1 font-bold">08</span>
          </div>
        </div>
        {/* Ship to */}
        <div className="border-l border-r border-b border-[#1A1A1A]">
          <div className="bg-gray-50 border-b border-[#1A1A1A] text-center font-bold py-1">Ship to Party (if applicable)</div>
          <div className="p-2 space-y-1">
            <p className="font-bold">Name: {sanitize(safeParty.name)}</p>
            <p>Address: <span className="whitespace-pre-wrap">{sanitize(safeParty.address)}</span></p>
            {safeParty.phone && <p>Phone: {sanitize(safeParty.phone)}</p>}
            {safeParty.gstin && <p className="font-bold">GSTIN: {sanitize(safeParty.gstin)}</p>}
          </div>
          <div className="border-t border-[#1A1A1A] flex mt-auto">
            <span className="flex-grow px-2 py-1">.</span>
            <span className="border-l border-[#1A1A1A] px-4 py-1 font-bold">Code</span>
            <span className="border-l border-[#1A1A1A] px-4 py-1 font-bold">08</span>
          </div>
        </div>
      </div>

      {/* Main Items Table */}
      <div className="w-full">
        <table className="invoice-table w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 text-center font-bold">
              <th className="w-8" rowSpan="2">S. No.</th>
              <th className="w-48" rowSpan="2">Product Description</th>
              <th rowSpan="2">HSN code</th>
              <th rowSpan="2">UOM</th>
              <th rowSpan="2">Qty</th>
              <th rowSpan="2">Rate</th>
              <th rowSpan="2">Amount</th>
              <th rowSpan="2">Discount</th>
              <th rowSpan="2">Taxable Value</th>
              <th colSpan="2">CGST</th>
              <th colSpan="2">SGST</th>
              <th className="w-16" rowSpan="2">Total</th>
            </tr>
            <tr className="bg-gray-50 text-center font-bold">
              <th className="w-8">Rate</th>
              <th className="w-10">Amount</th>
              <th className="w-8">Rate</th>
              <th className="w-10">Amount</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, index) => {
              const itemTotal = (Number(item.qty) || 0) * (Number(item.rate) || 0);
              const itemCgst = invoice.gstEnabled ? (itemTotal * cgstRate) / 100 : 0;
              const itemSgst = invoice.gstEnabled ? (itemTotal * sgstRate) / 100 : 0;
              const lineGrand = itemTotal + itemCgst + itemSgst;

              return (
                <tr key={index}>
                  <td className="text-center">{index + 1}</td>
                  <td className="text-left whitespace-pre-wrap p-1">{sanitize(item.description)}</td>
                  <td className="text-center">{sanitize(item.hsnCode || '')}</td>
                  <td className="text-center">{sanitize(item.uom || 'Nos')}</td>
                  <td className="text-right">{sanitize(String(item.qty))}</td>
                  <td className="text-right">{formatINR(item.rate, false)}</td>
                  <td className="text-right">{formatINR(itemTotal, false)}</td>
                  <td className="text-right">0</td>
                  <td className="text-right">{formatINR(itemTotal, false)}</td>
                  <td className="text-right">{invoice.gstEnabled ? `${cgstRate}%` : '-'}</td>
                  <td className="text-right">{invoice.gstEnabled ? formatINR(itemCgst, false) : '-'}</td>
                  <td className="text-right">{invoice.gstEnabled ? `${sgstRate}%` : '-'}</td>
                  <td className="text-right">{invoice.gstEnabled ? formatINR(itemSgst, false) : '-'}</td>
                  <td className="text-right font-bold">{formatINR(lineGrand, false)}</td>
                </tr>
              );
            })}
            
            {/* Table Footer / Total Row */}
            <tr className="font-bold text-sm">
              <td className="text-center py-2 uppercase tracking-widest text-base" colSpan="4">Total</td>
              <td className="text-right">{totalQty}</td>
              <td></td>
              <td className="text-right">{formatINR(invoice.subtotal, false)}</td>
              <td></td>
              <td className="text-right">{formatINR(invoice.subtotal, false)}</td>
              <td></td>
              <td className="text-right">{invoice.gstEnabled ? formatINR(cgstAmount, false) : '-'}</td>
              <td></td>
              <td className="text-right">{invoice.gstEnabled ? formatINR(sgstAmount, false) : '-'}</td>
              <td className="text-right">{formatINR(invoice.subtotal + (invoice.gstEnabled ? cgstAmount + sgstAmount : 0), false)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-5 border-l border-r border-[#1A1A1A]">
        {/* Amount in Words */}
        <div className="col-span-3 border-r border-[#1A1A1A]">
          <div className="bg-gray-50 border-b border-[#1A1A1A] p-1 text-center font-bold">Total Invoice amount in words</div>
          <div className="p-4 text-center font-semibold text-sm capitalize">
            {totalWords} Only
          </div>
          {/* Bank Details */}
          <div className="border-t border-[#1A1A1A]">
            <div className="bg-gray-50 border-b border-[#1A1A1A] p-1 text-center font-bold">Bank Details</div>
            <div className="p-2 space-y-0.5">
              <p className="font-bold uppercase">{sanitize(safeBusiness.bankName || 'BANK NAME NOT SET')}</p>
              <p className="font-bold">Bank A/C: {sanitize(safeBusiness.bankAccount || '—')}</p>
              <p className="font-bold">Bank IFSC: {sanitize(safeBusiness.bankIfsc || '—')}</p>
            </div>
          </div>
        </div>

        {/* Final Calculation Summary */}
        <div className="col-span-2">
          <div className="divide-y divide-[#1A1A1A] border-[#1A1A1A]">
            <div className="grid grid-cols-2 font-bold">
              <div className="p-1 px-2">Total Amount before Tax</div>
              <div className="p-1 px-2 text-right">{formatINR(invoice.subtotal, false)}</div>
            </div>
            <div className="grid grid-cols-2 font-bold">
              <div className="p-1 px-2">Add: CGST</div>
              <div className="p-1 px-2 text-right">{invoice.gstEnabled ? formatINR(cgstAmount, false) : '-'}</div>
            </div>
            <div className="grid grid-cols-2 font-bold">
              <div className="p-1 px-2">Add: SGST</div>
              <div className="p-1 px-2 text-right">{invoice.gstEnabled ? formatINR(sgstAmount, false) : '-'}</div>
            </div>
            {invoice.discount > 0 && (
              <div className="grid grid-cols-2 font-bold text-red-600">
                <div className="p-1 px-2 border-b border-[#1A1A1A]">Less: Discount</div>
                <div className="p-1 px-2 text-right border-b border-[#1A1A1A]">{formatINR(invoice.discount, false)}</div>
              </div>
            )}
            <div className="grid grid-cols-2 font-bold">
              <div className="p-1 px-2 border-b border-[#1A1A1A]">Total Tax Amount</div>
              <div className="p-1 px-2 text-right border-b border-[#1A1A1A]">{invoice.gstEnabled ? formatINR(cgstAmount + sgstAmount, false) : '-'}</div>
            </div>
            <div className="grid grid-cols-2 font-bold">
              <div className="p-1 px-2">Round off</div>
              <div className="p-1 px-2 text-right"></div>
            </div>
            <div className="grid grid-cols-2 text-sm font-black bg-gray-50 border-t border-b border-[#1A1A1A]">
              <div className="p-1 px-2">Total Amount after Tax:</div>
              <div className="p-1 px-2 text-right">{formatINR(invoice.grandTotal, false)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Terms & Signatory */}
      <div className="grid grid-cols-5 border border-[#1A1A1A] min-h-[120px]">
        <div className="col-span-3 p-4 flex flex-col justify-center items-center space-y-1">
          <h3 className="font-bold underline">Terms & conditions</h3>
          <p className="font-bold">Our Reponsibilities ceases as goods leave our premises</p>
        </div>
        <div className="col-span-2 border-l border-[#1A1A1A] relative p-4 flex flex-col items-center">
          <div className="text-[8px] italic text-center mb-6">Certified that the particulars given above are true and correct</div>
          <div className="font-bold uppercase">For {sanitize(safeBusiness.name || 'BUSINESS NAME')}</div>
          <div className="absolute bottom-2 font-bold border-t border-[#1A1A1A] w-4/5 pt-1 text-center">
            Authorised signatory
          </div>
        </div>
      </div>
    </div>
  );
}
