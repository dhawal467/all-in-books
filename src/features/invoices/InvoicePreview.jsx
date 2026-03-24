import React from 'react';
import DOMPurify from 'dompurify';
import { formatINR } from '../../utils/currency';

const sanitize = (str) => DOMPurify.sanitize(str ?? '', { ALLOWED_TAGS: [] });

export default function InvoicePreview({ invoice, business, party }) {
  if (!invoice) return <div style={{ padding: '20px' }}>No invoice data provided.</div>;

  const safeBusiness = business || { name: 'Your Business Name', address: '123 Business Road, City, State, ZIP' };
  const safeParty = party || { name: 'Unknown Party' };
  const lineItems = invoice.lineItems || [];

  return (
    <div
      style={{
        width: '794px',
        minHeight: '1123px',
        padding: '40px',
        background: 'white',
        boxSizing: 'border-box',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#333',
        margin: '0 auto',
      }}
    >
      {/* 1. Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
        {/* Left: Business Info */}
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: '0 0 5px 0', fontSize: '24px', color: '#111' }}>
            {sanitize(safeBusiness.name)}
          </h1>
          <p style={{ margin: '0', fontSize: '14px', color: '#666', whiteSpace: 'pre-wrap' }}>
            {sanitize(safeBusiness.address)}
          </p>
        </div>

        {/* Right: Invoice Info */}
        <div style={{ textAlign: 'right', flex: 1 }}>
          <h2 style={{ margin: '0 0 10px 0', fontSize: '32px', color: '#2C3E50', letterSpacing: '1px' }}>
            INVOICE
          </h2>
          <table style={{ marginLeft: 'auto', borderCollapse: 'collapse', fontSize: '14px' }}>
            <tbody>
              <tr>
                <td style={{ padding: '2px 10px 2px 0', fontWeight: 'bold', color: '#555', textAlign: 'right' }}>Date:</td>
                <td style={{ padding: '2px 0', textAlign: 'right' }}>{invoice.issueDate || '—'}</td>
              </tr>
              <tr>
                <td style={{ padding: '2px 10px 2px 0', fontWeight: 'bold', color: '#555', textAlign: 'right' }}>Invoice #:</td>
                <td style={{ padding: '2px 0', textAlign: 'right' }}>{invoice.invoiceNumber || '—'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Bill To Section */}
      <div style={{ marginBottom: '40px' }}>
        <h3 style={{ margin: '0 0 5px 0', fontSize: '12px', textTransform: 'uppercase', color: '#888', letterSpacing: '0.5px' }}>
          Bill To:
        </h3>
        <p style={{ margin: '0 0 3px 0', fontSize: '16px', fontWeight: 'bold', color: '#222' }}>
          {sanitize(safeParty.name)}
        </p>
        <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>
          {safeParty.phone ? `Phone: ${sanitize(safeParty.phone)}` : ''}
        </p>
      </div>

      {/* 3. Line Items Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
        <thead>
          <tr>
            <th style={{ padding: '12px 10px', backgroundColor: '#F4F8FA', color: '#333', fontWeight: 'bold', fontSize: '14px', textAlign: 'left', borderBottom: '2px solid #B8D0E8' }}>#</th>
            <th style={{ padding: '12px 10px', backgroundColor: '#F4F8FA', color: '#333', fontWeight: 'bold', fontSize: '14px', textAlign: 'left', borderBottom: '2px solid #B8D0E8' }}>Description</th>
            <th style={{ padding: '12px 10px', backgroundColor: '#F4F8FA', color: '#333', fontWeight: 'bold', fontSize: '14px', textAlign: 'right', borderBottom: '2px solid #B8D0E8' }}>Qty</th>
            <th style={{ padding: '12px 10px', backgroundColor: '#F4F8FA', color: '#333', fontWeight: 'bold', fontSize: '14px', textAlign: 'right', borderBottom: '2px solid #B8D0E8' }}>Rate</th>
            <th style={{ padding: '12px 10px', backgroundColor: '#F4F8FA', color: '#333', fontWeight: 'bold', fontSize: '14px', textAlign: 'right', borderBottom: '2px solid #B8D0E8' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {lineItems.map((item, index) => {
            const rowTotal = (Number(item.qty) || 0) * (Number(item.rate) || 0);
            return (
              <tr key={item.id || index} style={{ backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#FAFCFD' }}>
                <td style={{ padding: '12px 10px', fontSize: '14px', color: '#444', borderBottom: '1px solid #EBEBEB' }}>
                  {index + 1}
                </td>
                <td style={{ padding: '12px 10px', fontSize: '14px', color: '#222', borderBottom: '1px solid #EBEBEB' }}>
                  {sanitize(item.description)}
                </td>
                <td style={{ padding: '12px 10px', fontSize: '14px', color: '#444', textAlign: 'right', borderBottom: '1px solid #EBEBEB' }}>
                  {sanitize(String(item.qty))}
                </td>
                <td style={{ padding: '12px 10px', fontSize: '14px', color: '#444', textAlign: 'right', borderBottom: '1px solid #EBEBEB' }}>
                  {formatINR(item.rate, false)}
                </td>
                <td style={{ padding: '12px 10px', fontSize: '14px', color: '#222', fontWeight: '600', textAlign: 'right', borderBottom: '1px solid #EBEBEB' }}>
                  {formatINR(rowTotal, false)}
                </td>
              </tr>
            );
          })}
          {lineItems.length === 0 && (
            <tr>
              <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#999', fontSize: '14px', borderBottom: '1px solid #EBEBEB' }}>
                No line items added.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* 4. Totals Block */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <table style={{ width: '300px', borderCollapse: 'collapse', fontSize: '14px' }}>
          <tbody>
            <tr>
              <td style={{ padding: '8px 10px', fontWeight: 'bold', color: '#555', textAlign: 'right' }}>Subtotal:</td>
              <td style={{ padding: '8px 10px', textAlign: 'right', color: '#222' }}>
                {formatINR(invoice.subtotal, false)}
              </td>
            </tr>

            {Boolean(invoice.gstRate && invoice.gstAmount) && (
              <tr>
                <td style={{ padding: '8px 10px', fontWeight: 'bold', color: '#555', textAlign: 'right' }}>
                  GST ({invoice.gstRate}%):
                </td>
                <td style={{ padding: '8px 10px', textAlign: 'right', color: '#222' }}>
                  {formatINR(invoice.gstAmount, false)}
                </td>
              </tr>
            )}

            {Boolean(invoice.discount) && (
              <tr>
                <td style={{ padding: '8px 10px', fontWeight: 'bold', color: '#555', textAlign: 'right' }}>Discount:</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', color: '#E53E3E' }}>
                  -{formatINR(invoice.discount, false)}
                </td>
              </tr>
            )}

            <tr style={{ backgroundColor: '#F4F8FA' }}>
              <td style={{ padding: '12px 10px', fontWeight: 'bold', color: '#111', fontSize: '16px', textAlign: 'right', borderTop: '2px solid #B8D0E8', borderBottom: '2px solid #B8D0E8' }}>
                Grand Total:
              </td>
              <td style={{ padding: '12px 10px', fontWeight: 'bold', color: '#111', fontSize: '16px', textAlign: 'right', borderTop: '2px solid #B8D0E8', borderBottom: '2px solid #B8D0E8' }}>
                {formatINR(invoice.grandTotal, false)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
