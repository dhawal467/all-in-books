import { create } from 'zustand';
import { db } from '../db/db.js';
import { generateUUID } from '../utils/uuid.js';
import { 
  computeRecordHash, 
  verifyRecordHash, 
  markRecordTampered, 
  CRITICAL_FIELDS,
  setIntegrityStatus,
  getIntegrityStatus 
} from '../utils/integrity.js';

export const useTransactionStore = create((set, get) => ({
  transactions: [],
  loading: false,
  integrityWarning: false,

  load: async ({ type, from, to, partyId } = {}) => {
    set({ loading: true });
    let query = db.transactions.where('bookId').equals('main');
    
    if (type)    query = query.filter(t => t.type === type);
    if (partyId) query = query.filter(t => t.partyId === partyId);
    if (from)    query = query.filter(t => t.date >= from);
    if (to)      query = query.filter(t => t.date <= to);
    
    let transactions = await query.toArray();
    
    let hasTampered = false;
    for (const tx of transactions) {
      const isValid = await verifyRecordHash(tx, CRITICAL_FIELDS.transaction);
      if (!isValid) {
        tx._tampered = true;
        hasTampered = true;
      }
    }
    
    if (hasTampered) {
      setIntegrityStatus(true);
      set({ integrityWarning: true });
    } else if (getIntegrityStatus()) {
      setIntegrityStatus(false);
      set({ integrityWarning: false });
    }
    
    transactions.sort((a, b) => b.date.localeCompare(a.date));

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
    
    if (!entry.id) {
       entry.id = data.id || generateUUID(); 
    }
    
    entry._hash = await computeRecordHash(entry, CRITICAL_FIELDS.transaction);

    await db.transactions.add(entry);
    await get().load();
    return entry;
  },

  update: async (id, changes) => {
    const existing = await db.transactions.get(id);
    if (existing) {
      changes._hash = await computeRecordHash({ ...existing, ...changes }, CRITICAL_FIELDS.transaction);
    }
    await db.transactions.update(id, { ...changes, updatedAt: Date.now() });
    await get().load();
  },

  remove: async (id) => {
    await db.transactions.delete(id);
    await get().load();
  },

  getTodaySummary: async () => {
    const today = new Date().toLocaleDateString('en-CA');
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
