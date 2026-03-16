import { create } from 'zustand';
import { db } from '../db/db.js';

export const usePartyStore = create((set, get) => ({
  parties: [],
  loading: false,

  load: async () => {
    set({ loading: true });
    const parties = await db.parties.where('bookId').equals('main').toArray();
    set({ parties, loading: false });
  },

  add: async (data) => {
    const partyId = await db.parties.add({
      ...data,
      bookId: 'main',
      createdAt: Date.now()
    });
    await get().load();
    return partyId;
  },

  update: async (id, changes) => {
    await db.parties.update(id, changes);
    await get().load();
  },

  search: async (query) => {
    if (!query) return [];
    const lowerQuery = query.toLowerCase();
    
    // Fuzzy match on name directly from indexedDB array (since we cache it or query it)
    const parties = await db.parties.where('bookId').equals('main').toArray();
    return parties.filter(p => p.name.toLowerCase().includes(lowerQuery));
  },

  getStatement: async (partyId, dateRange) => {
    let query = db.transactions.where('partyId').equals(partyId);
    if (dateRange && dateRange.from) {
      query = query.filter(t => t.date >= dateRange.from);
    }
    if (dateRange && dateRange.to) {
      query = query.filter(t => t.date <= dateRange.to);
    }
    const transactions = await query.sortBy('date');
    const party = await db.parties.get(partyId);
    
    return { party, transactions };
  }
}));
