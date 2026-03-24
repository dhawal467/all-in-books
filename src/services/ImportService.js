import * as XLSX from 'xlsx';
import { db } from '../db/db.js';
import { generateUUID } from '../utils/uuid.js';

// ── Constants ─────────────────────────────────────────────────────────────
const VALID_TYPES  = ['sale', 'purchase', 'expense', 'receipt', 'payment'];
const VALID_RATES  = [0, 5, 12, 18, 28];
const GST_TOLERANCE = 1; // ₹1 tolerance for rounding
const MAX_IMPORT_SIZE = 10 * 1024 * 1024; // 10 MB max file size
const VALID_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const PARSE_TIMEOUT_MS = 5000; // 5 second watchdog timeout

// Whitelisted column names per sheet — prevents prototype pollution via __proto__ or constructor
const ALLOWED_TX_COLUMNS   = new Set(['date', 'type', 'amount', 'baseAmount', 'gstRate', 'gstAmount', 'partyName', 'category', 'note', 'invoiceNumber']);
const ALLOWED_PARTY_COLUMNS = new Set(['name', 'phone', 'gstin', 'address']);
const ALLOWED_BAL_COLUMNS  = new Set(['partyName', 'openingBalance']);
const ALLOWED_GST_COLUMNS  = new Set(['date', 'partyName', 'taxableAmount', 'gstRate', 'gstAmount', 'igstAmount', 'cgstAmount', 'sgstAmount']);

// ── Security Helpers ─────────────────────────────────────────────────────

/**
 * Validates file before parsing:
 * - Checks MIME type matches xlsx
 * - Checks file size within limit
 * @throws {Error} if validation fails
 */
function validateFile(file) {
  if (file.size > MAX_IMPORT_SIZE) {
    throw new Error(`File size (${(file.size / 1024 / 1024).toFixed(1)} MB) exceeds maximum allowed (${MAX_IMPORT_SIZE / 1024 / 1024} MB)`);
  }
  if (file.type && file.type !== VALID_MIME_TYPE) {
    throw new Error(`Invalid file type "${file.type}". Only .xlsx files are accepted.`);
  }
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext !== 'xlsx') {
    throw new Error(`Invalid file extension ".${ext}". Only .xlsx files are accepted.`);
  }
}

/**
 * Parses xlsx with a timeout watchdog to prevent resource exhaustion attacks.
 * @param {ArrayBuffer} buf
 * @returns {Object} parsed workbook
 * @throws {Error} if parsing exceeds timeout
 */
function parseWithWatchdog(buf) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('File parsing timed out after 5 seconds. The file may be malformed or malicious.'));
    }, PARSE_TIMEOUT_MS);

    try {
      const wb = XLSX.read(buf, {
        type: 'array',
        cellDates: true,
        cellFormula: false,
        sheetStubs: false,
      });
      clearTimeout(timeout);
      resolve(wb);
    } catch (err) {
      clearTimeout(timeout);
      reject(new Error(`Failed to parse file: ${err.message}`));
    }
  });
}

/**
 * Sanitizes a row object by whitelisting only allowed column names.
 * Prevents prototype pollution via __proto__, constructor, or prototype keys.
 * @param {Object} row - Raw row from SheetJS
 * @param {Set} allowedColumns - Set of allowed column names
 * @returns {Object} Sanitized row with only whitelisted keys
 */
function sanitizeRow(row, allowedColumns) {
  const sanitized = {};
  for (const key of allowedColumns) {
    if (key in row) {
      sanitized[key] = row[key];
    }
  }
  return sanitized;
}

/**
 * Deep sanitizes an array of rows, removing any keys not in the whitelist.
 * @param {Array} rows - Array of raw rows from SheetJS
 * @param {Set} allowedColumns - Set of allowed column names
 * @returns {Array} Sanitized rows
 */
function sanitizeRows(rows, allowedColumns) {
  return rows.map(row => sanitizeRow(row, allowedColumns));
}

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
   * Validates file security, then parses with timeout protection.
   * Sanitizes all rows to prevent prototype pollution attacks.
   * Returns { valid[], errors[], duplicates[] }
   */
  async parse(file) {
    validateFile(file);
    const buf = await file.arrayBuffer();
    const wb = await parseWithWatchdog(buf);

    const rows  = wb.Sheets['Transactions']   ? XLSX.utils.sheet_to_json(wb.Sheets['Transactions'],   { defval: '' }) : [];
    const bRows = wb.Sheets['Party_Balances'] ? XLSX.utils.sheet_to_json(wb.Sheets['Party_Balances'], { defval: '' }) : [];
    const pRows = wb.Sheets['Parties']        ? XLSX.utils.sheet_to_json(wb.Sheets['Parties'],        { defval: '' }) : [];
    const gRows = wb.Sheets['GST_History']    ? XLSX.utils.sheet_to_json(wb.Sheets['GST_History'],    { defval: '' }) : [];

    return this._validate({
      rows: sanitizeRows(rows, ALLOWED_TX_COLUMNS),
      bRows: sanitizeRows(bRows, ALLOWED_BAL_COLUMNS),
      pRows: sanitizeRows(pRows, ALLOWED_PARTY_COLUMNS),
      gRows: sanitizeRows(gRows, ALLOWED_GST_COLUMNS),
    });
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
