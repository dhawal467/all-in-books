import * as XLSX from 'xlsx';
import { db } from '../db/db.js';
import { generateUUID } from '../utils/uuid.js';

// ── Constants ─────────────────────────────────────────────────────────────
const VALID_TYPES  = ['sale', 'purchase', 'expense', 'receipt', 'payment'];
const VALID_RATES  = [0, 5, 12, 18, 28];
const GST_TOLERANCE = 1; // ₹1 tolerance for rounding

// ── Helpers ───────────────────────────────────────────────────────────────

/** Normalize an incoming date value to YYYY-MM-DD or null */
function normalizeDate(raw) {
  if (!raw) return null;
  // If SheetJS returned a JS Date (cellDates:true)
  if (raw instanceof Date) {
    return raw.toISOString().split('T')[0];
  }
  // If it's already a string that looks like a date
  const str = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  // Try to parse freeform dates
  const d = new Date(str);
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  return null;
}

/** Build a lightweight fingerprint for duplicate detection */
function fingerprint(row) {
  return `${row.date}|${row.type}|${row.amount}|${(row.partyName || '').trim().toLowerCase()}`;
}

// ── ImportService ──────────────────────────────────────────────────────────
export const ImportService = {

  /**
   * Step 1 — Parse and validate (no DB writes).
   * Returns { valid[], errors[], duplicates[] }
   */
  async parse(file) {
    const buf  = await file.arrayBuffer();
    const wb   = XLSX.read(buf, { type: 'array', cellDates: true });

    const rows  = wb.Sheets['Transactions']   ? XLSX.utils.sheet_to_json(wb.Sheets['Transactions'],   { defval: '' }) : [];
    const bRows = wb.Sheets['Party_Balances'] ? XLSX.utils.sheet_to_json(wb.Sheets['Party_Balances'], { defval: '' }) : [];
    const pRows = wb.Sheets['Parties']        ? XLSX.utils.sheet_to_json(wb.Sheets['Parties'],        { defval: '' }) : [];
    const gRows = wb.Sheets['GST_History']    ? XLSX.utils.sheet_to_json(wb.Sheets['GST_History'],    { defval: '' }) : [];

    return this._validate({ rows, bRows, pRows, gRows });
  },

  /**
   * Internal — validate rows and return structured result.
   */
  async _validate({ rows, bRows, pRows, gRows }) {
    // Fetch existing transaction fingerprints for duplicate detection
    const existing = await db.transactions.toArray();
    const existingFingerprints = new Set(existing.map(t => fingerprint(t)));

    const valid      = [];
    const errors     = [];
    const duplicates = [];

    // Skip the first two rows if they appear to be the hints / example rows
    // (Row 1 = headers already consumed by sheet_to_json, Row 2 = hints, Row 3 = example)
    // We detect hint rows by checking if 'type' contains a '|' character.
    const dataRows = rows.filter(r => {
      const t = String(r.type || '').trim();
      return t !== '' && !t.includes('|');
    });

    for (let i = 0; i < dataRows.length; i++) {
      const raw = dataRows[i];
      const rowNum = i + 4; // 1=header, 2=hints, 3=example → data starts at 4
      const rowErrors = [];

      // V-001: date required and parseable
      const date = normalizeDate(raw.date);
      if (!date) {
        rowErrors.push('date is missing or unparseable (expected YYYY-MM-DD)');
      }

      // V-002: type must be a valid enum
      const type = String(raw.type || '').trim().toLowerCase();
      if (!VALID_TYPES.includes(type)) {
        rowErrors.push(`type "${raw.type}" is invalid — must be one of: ${VALID_TYPES.join(', ')}`);
      }

      // V-003: amount must be a positive number
      const amount = Number(raw.amount);
      if (isNaN(amount) || amount <= 0) {
        rowErrors.push(`amount "${raw.amount}" must be a positive number`);
      }

      // V-004: GST consistency check (optional fields — only validated when both present)
      const baseAmount = raw.baseAmount !== '' ? Number(raw.baseAmount) : null;
      const gstAmount  = raw.gstAmount  !== '' ? Number(raw.gstAmount)  : null;
      const gstRate    = raw.gstRate    !== '' ? Number(raw.gstRate)    : null;

      if (baseAmount !== null && gstAmount !== null && !isNaN(amount)) {
        const diff = Math.abs(amount - baseAmount - gstAmount);
        if (diff > GST_TOLERANCE) {
          rowErrors.push(`GST consistency error: baseAmount (${baseAmount}) + gstAmount (${gstAmount}) should equal amount (${amount}), diff = ${diff.toFixed(2)}`);
        }
      }

      if (gstRate !== null && !isNaN(gstRate) && !VALID_RATES.includes(gstRate)) {
        rowErrors.push(`gstRate "${gstRate}" is not a valid GST rate — must be one of: ${VALID_RATES.join(', ')}`);
      }

      // Build normalised row object
      const normalised = {
        date:         date || String(raw.date),
        type,
        amount,
        baseAmount:   baseAmount ?? null,
        gstRate:      gstRate ?? null,
        gstAmount:    gstAmount ?? null,
        partyName:    String(raw.partyName  || '').trim(),
        category:     String(raw.category   || '').trim(),
        note:         String(raw.note       || '').slice(0, 500),
        invoiceNumber:String(raw.invoiceNumber || '').trim(),
        _rowNum:      rowNum,
      };

      if (rowErrors.length > 0) {
        errors.push({ ...normalised, _errors: rowErrors });
        continue;
      }

      // V-006: duplicate check
      const fp = fingerprint(normalised);
      if (existingFingerprints.has(fp)) {
        duplicates.push({ ...normalised, _errors: ['Duplicate — a matching transaction already exists in the database'] });
        continue;
      }

      valid.push(normalised);
    }

    return {
      valid,
      errors,
      duplicates,
      partyRows:      pRows,
      balanceRows:    bRows,
      gstHistoryRows: gRows,
    };
  },

  /**
   * Step 2 — Write validated rows to IndexedDB.
   * Returns the importBatchId for use in undo.
   */
  async commit(validRows, bookId = 'main') {
    const batchId  = generateUUID();
    const now      = Date.now();

    await db.transaction('rw', db.transactions, db.importBatches, async () => {
      for (const row of validRows) {
        // Strip internal meta fields before persisting
        const { _rowNum, _errors, partyName, category, ...rest } = row;
        await db.transactions.add({
          ...rest,
          bookId,
          isImported:     true,
          importBatchId:  batchId,
          createdAt:      now,
          updatedAt:      now,
        });
      }

      await db.importBatches.add({
        id:           batchId,
        bookId,
        importedAt:   now,
        rowsImported: validRows.length,
        rowsSkipped:  0,
        rowsErrored:  0,
        undoneAt:     null,
      });
    });

    return batchId;
  },

  /**
   * Step 3 — Undo an import batch (available at any time).
   * Deletes only the imported transactions; does not touch manual entries.
   */
  async undo(batchId) {
    await db.transaction('rw', db.transactions, db.importBatches, async () => {
      await db.transactions.where('importBatchId').equals(batchId).delete();
      await db.importBatches.update(batchId, { undoneAt: Date.now() });
    });
  },
};
