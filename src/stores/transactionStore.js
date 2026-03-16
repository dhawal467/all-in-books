import { create } from 'zustand';
import { db } from '../db/db.js';
import { generateUUID } from '../utils/uuid.js';

export const useTransactionStore = create((set, get) => ({
  transactions: [],
  loading: false,

  load: async ({ type, from, to, partyId } = {}) => {
    set({ loading: true });
    // Dexie orderBy gets everything, then we filter in memory or via where
    let query = db.transactions.where('bookId').equals('main');
    
    // Using simple filter chaining since bookId is our base index
    if (type)    query = query.filter(t => t.type === type);
    if (partyId) query = query.filter(t => t.partyId === partyId);
    if (from)    query = query.filter(t => t.date >= from);
    if (to)      query = query.filter(t => t.date <= to);
    
    // Sort logic normally .orderBy('date').reverse(), but we used .where() already
    // so we get array and sort manually for robust behavior
    let transactions = await query.toArray();
    transactions.sort((a, b) => b.date.localeCompare(a.date)); // Descending by date

    set({ transactions, loading: false });
  },

  add: async (data) => {
    const entry = {
      ...data,
      bookId: 'main',
      createdAt: data.createdAt || Date.now(),
      updatedAt: data.updatedAt || Date.now(),
      isImported: data.isImported || false,
    };
    
    // Make sure generateId is called if not provided
    if (!entry.id) {
       // but wait, id is auto-increment in dexie schemas (++id), so we don't need a UUID unless requested
       // Although TIP says we use generateId(), let's not break auto-increment if it works. 
       // Actually TIP says: import { generateId } ... const entry = { ...data, id: generateId(), ... }
       // So we will add the id but let auto-increment handle ++id. 
       // If id is string Dexie might complain on ++id if expecting number. Wait, Dexie handles string ++id fine or we can just omit id.
       // The TIP says "const entry = { ...data, id: generateId(), createdAt: Date.now(), updatedAt: Date.now(), isImported: false };"
       entry.id = data.id || generateUUID(); 
    }

    await db.transactions.add(entry);
    await get().load();
    return entry;
  },

  update: async (id, changes) => {
    await db.transactions.update(id, { ...changes, updatedAt: Date.now() });
    await get().load();
  },

  remove: async (id) => {
    await db.transactions.delete(id);
    await get().load();
  },

  getTodaySummary: async () => {
    // Current local date YYYY-MM-DD
    const today = new Date().toLocaleDateString('en-CA'); // Gets YYYY-MM-DD reliably
    const todayTx = await db.transactions
      .where('bookId')
      .equals('main')
      .filter(t => t.date === today)
      .toArray();

    const totalIn  = todayTx.filter(t => ['sale','receipt'].includes(t.type))
                            .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const totalOut = todayTx.filter(t => ['purchase','expense','payment'].includes(t.type))
                            .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    return {
      totalIn,
      totalOut,
      net: totalIn - totalOut
    };
  },

  getPartyBalance: async (partyId) => {
    const partyTx = await db.transactions
      .where('partyId')
      .equals(partyId)
      .toArray();

    const totalIn  = partyTx.filter(t => ['sale','receipt'].includes(t.type))
                            .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const totalOut = partyTx.filter(t => ['purchase','expense','payment'].includes(t.type))
                            .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    return totalIn - totalOut;
  }
}));
