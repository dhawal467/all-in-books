import Dexie from 'dexie';

export const db = new Dexie('AllInBooks');

db.version(1).stores({
  transactions:  '++id, bookId, type, date, partyId, categoryId, isImported, importBatchId',
  parties:       '++id, bookId, name',
  invoices:      '++id, bookId, partyId, status, invoiceNumber',
  categories:    '++id, bookId, type',
  books:         '++id',
  importBatches: '++id, bookId, importedAt',
  recurringEntries: '++id, bookId, nextDueDate, isActive',
  attachments:   '++id, transactionId',
});
