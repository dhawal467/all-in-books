import { create } from 'zustand';
import { db } from '../db/db.js';
import { 
  computeRecordHash, 
  verifyRecordHash, 
  CRITICAL_FIELDS,
  setIntegrityStatus,
  getIntegrityStatus 
} from '../utils/integrity.js';

export const usePartyStore = create((set, get) => ({
  parties: [],
  loading: false,
  integrityWarning: false,

  load: async () => {
    set({ loading: true });
    let parties = await db.parties.where('bookId').equals('main').toArray();
    
    let hasTampered = false;
    for (const party of parties) {
      const isValid = await verifyRecordHash(party, CRITICAL_FIELDS.party);
      if (!isValid) {
        party._tampered = true;
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
    
    set({ parties, loading: false });
  },

  add: async (data) => {
    const partyData = {
      ...data,
      bookId: 'main',
      createdAt: Date.now()
    };
    partyData._hash = await computeRecordHash(partyData, CRITICAL_FIELDS.party);
    
    const partyId = await db.parties.add(partyData);
    await get().load();
    return partyId;
  },

  update: async (id, changes) => {
    const existing = await db.parties.get(id);
    if (existing) {
      changes._hash = await computeRecordHash({ ...existing, ...changes }, CRITICAL_FIELDS.party);
    }
    await db.parties.update(id, changes);
    await get().load();
  },

  search: async (query) => {
    if (!query) return [];
    const lowerQuery = query.toLowerCase();
    
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
