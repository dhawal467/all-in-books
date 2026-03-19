/**
 * InvoicePDF.js
 *
 * Service for rendering InvoicePreview to a PDF and sharing/downloading it.
 * Uses ReactDOM.createRoot → html2canvas → jsPDF pipeline.
 *
 * Exports:
 *   generate(invoiceData, business, party)  → Promise<{ blob, url, filename }>
 *   shareInvoice(invoiceData, business, party) → Promise<void>
 */

import React from 'react';
import * as ReactDOM from 'react-dom/client';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import InvoicePreview from '../features/invoices/InvoicePreview';

// A4 dimensions in mm
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

/**
 * Renders InvoicePreview off-screen, captures it, and returns a PDF Blob + URL.
 * The hidden DOM container is always cleaned up in a finally block.
 *
 * @param {Object} invoiceData - The full invoice object from the store
 * @param {Object} business    - The business profile { name, address, ... }
 * @param {Object} party       - The party object { name, phone, ... }
 * @returns {Promise<{ blob: Blob, url: string, filename: string }>}
 */
export async function generate(invoiceData, business, party) {
  const filename = `Invoice_${(invoiceData?.invoiceNumber || 'draft').replace(/[^a-z0-9_\-]/gi, '_')}.pdf`;

  // 1. Create an off-screen container
  const container = document.createElement('div');
  container.style.cssText = [
    'position: fixed',
    'left: -9999px',
    'top: 0',
    'width: 794px',
    'background: white',
    'z-index: -9999',
  ].join('; ');
  document.body.appendChild(container);

  const root = ReactDOM.createRoot(container);

  try {
    // 2. Render the InvoicePreview React tree into the container
    await new Promise((resolve) => {
      root.render(
        <InvoicePreview
          invoice={invoiceData}
          business={business}
          party={party}
        />
      );
      // Give React one animation frame to flush layout
      requestAnimationFrame(() => setTimeout(resolve, 100));
    });

    // 3. Capture with html2canvas at 2× for sharp PDF output
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    // 4. Build a jsPDF A4 document
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Scale the captured canvas image to fit A4 precisely
    pdf.addImage(
      canvas.toDataURL('image/png'),
      'PNG',
      0,       // x
      0,       // y
      A4_WIDTH_MM,
      A4_HEIGHT_MM
    );

    // 5. Export as Blob + Object URL
    const blob = pdf.output('blob');
    const url = URL.createObjectURL(blob);

    return { blob, url, filename };

  } finally {
    // 6. Always clean up — unmount React root then remove the DOM node
    root.unmount();
    container.remove();
  }
}

/**
 * Generates the PDF and opens the native share sheet (Android / iOS).
 * Falls back to a standard <a download> trigger on desktop browsers.
 *
 * @param {Object} invoiceData - The full invoice object from the store
 * @param {Object} business    - The business profile { name, address, ... }
 * @param {Object} party       - The party object { name, phone, ... }
 * @returns {Promise<void>}
 */
export async function shareInvoice(invoiceData, business, party) {
  const { blob, url, filename } = await generate(invoiceData, business, party);

  const pdfFile = new File([blob], filename, { type: 'application/pdf' });

  // Use the Web Share API when the browser + OS supports sharing files
  const canShareFiles =
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [pdfFile] });

  if (canShareFiles) {
    try {
      await navigator.share({
        files: [pdfFile],
        title: 'Invoice',
        text: 'Please find your invoice attached.',
      });
    } finally {
      // Release the Object URL regardless of share outcome
      URL.revokeObjectURL(url);
    }
  } else {
    // Fallback: trigger browser download
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    // Revoke after a short delay so the download has time to start
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  }
}
