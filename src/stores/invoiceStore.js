import { create } from 'zustand';
import { db } from '../db/db.js';

export const useInvoiceStore = create((set, get) => ({
  invoices: [],
  loading: false,

  load: async (filter = {}) => {
    set({ loading: true });
    let query = db.invoices.where('bookId').equals('main');
    
    if (filter.status) {
      // For status, it could be a secondary index query, but standard filter works
      query = query.filter(inv => inv.status === filter.status);
    }
    
    const invoices = await query.reverse().sortBy('issueDate');
    set({ invoices, loading: false });
  },

  add: async (data) => {
    const invoiceId = await db.invoices.add({
      ...data,
      bookId: 'main'
    });
    await get().load();
    return invoiceId;
  },

  update: async (id, changes) => {
    await db.invoices.update(id, changes);
    await get().load();
  },

  updateStatus: async (id, status) => {
    await db.invoices.update(id, { status });
    await get().load();
  },

  getNextInvoiceNumber: async () => {
    // Get highest invoice number starting with AIB-
    const invoices = await db.invoices.where('bookId').equals('main').toArray();
    let maxNumber = 0;
    
    invoices.forEach(inv => {
      const match = inv.invoiceNumber?.match(/^AIB-(\d{4})$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) {
          maxNumber = num;
        }
      }
    });

    return `AIB-${String(maxNumber + 1).padStart(4, '0')}`;
  }
}));
