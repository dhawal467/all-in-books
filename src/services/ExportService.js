import * as XLSX from 'xlsx';
import { db } from '../db/db.js';
import { computeExportHash, setLastExportHash } from '../utils/integrity.js';

const INFLOW_TYPES  = ['sale', 'receipt'];
const OUTFLOW_TYPES = ['purchase', 'expense', 'payment'];

class ExportService {
  /**
   * Generates a workbook containing all data and returns it as an ArrayBuffer.
   * Uses a read transaction to ensure consistent snapshot across all tables,
   * preventing partial data capture during concurrent writes (e.g., imports).
   * Records a hash of the exported data for integrity verification.
   */
  async generate(bookId = 'main') {
    const wb = XLSX.utils.book_new();

    // Read all data within a single transaction for snapshot consistency
    const { transactions, parties, invoices, categories } = await db.transaction(
      'r',
      db.transactions,
      db.parties,
      db.invoices,
      db.categories,
      async () => ({
        transactions: await db.transactions.where('bookId').equals(bookId).toArray(),
        parties:      await db.parties.where('bookId').equals(bookId).toArray(),
        invoices:     await db.invoices.where('bookId').equals(bookId).toArray(),
        categories:   await db.categories.where('bookId').equals(bookId).toArray(),
      })
    );

    // Compute integrity hash before generating xlsx
    const exportHash = await computeExportHash({
      transactions,
      parties,
      invoices,
      timestamp: Date.now()
    });

    // 1. Transactions
    const txSheet = XLSX.utils.json_to_sheet(transactions.map(t => ({
      ID: t.id,
      Date: t.date,
      Type: t.type,
      Amount: t.amount,
      GST_Amount: t.gstAmount || 0,
      Party_ID: t.partyId || '',
      Category_ID: t.categoryId || '',
      Notes: t.notes || '',
      Imported: t.isImported ? 'Yes' : 'No'
    })));
    XLSX.utils.book_append_sheet(wb, txSheet, 'Transactions');

    // 2. Parties (with calculated Outstanding Balance)
    const partyData = parties.map(party => {
      const partyTx = transactions.filter(t => t.partyId === party.id);
      
      const partyIn = partyTx.filter(t => INFLOW_TYPES.includes(t.type))
                             .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      const partyOut = partyTx.filter(t => OUTFLOW_TYPES.includes(t.type))
                              .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      
      const balance = partyIn - partyOut;
      let outstandingStr = '0.00';
      if (balance > 0) outstandingStr = `${balance.toFixed(2)} (To Receive)`;
      else if (balance < 0) outstandingStr = `${Math.abs(balance).toFixed(2)} (To Pay)`;
      
      return {
        ID: party.id,
        Name: party.name,
        Phone: party.phone || '',
        GSTIN: party.gstin || '',
        Address: party.address || '',
        Outstanding_Balance: outstandingStr
      };
    });
    const partySheet = XLSX.utils.json_to_sheet(partyData);
    XLSX.utils.book_append_sheet(wb, partySheet, 'Parties');

    // 3. Invoices
    const invoiceSheet = XLSX.utils.json_to_sheet(invoices.map(inv => ({
      ID: inv.id,
      Invoice_Number: inv.invoiceNumber,
      Status: inv.status,
      Party_ID: inv.partyId,
      Total_Amount: inv.totalAmount || 0,
      Issue_Date: inv.issueDate || '',
      Due_Date: inv.dueDate || ''
    })));
    XLSX.utils.book_append_sheet(wb, invoiceSheet, 'Invoices');

    // 4. Categories
    const categorySheet = XLSX.utils.json_to_sheet(categories.map(cat => ({
      ID: cat.id,
      Name: cat.name,
      Type: cat.type
    })));
    XLSX.utils.book_append_sheet(wb, categorySheet, 'Categories');

    // Write to ArrayBuffer
    const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    
    // Record the export hash for integrity verification
    setLastExportHash(exportHash);
    
    return { buffer, hash: exportHash };
  }

  /**
   * Triggers a browser download of the provided ArrayBuffer.
   */
  downloadNow(buffer, filename) {
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export default new ExportService();
