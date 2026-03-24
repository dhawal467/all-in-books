/**
 * BackupService.js
 * Orchestrates the full Google Drive backup flow:
 *   1. Gets a valid OAuth token from DriveAuth
 *   2. Generates the .xlsx buffer via ExportService
 *   3. Gets or creates the "All in Books" folder in Google Drive
 *   4. Uploads the file with a week-stamped filename
 *   5. Prunes old backups, keeping only the 4 most recent
 *   6. Stores the backup timestamp in localStorage
 *
 * Uses strictly the drive.file scope (only files this app created).
 * All Drive communication uses the Google Drive REST API v3 (no SDK).
 *
 * localStorage keys:
 *   lastBackupAt — epoch ms of the last successful backup run
 */

import DriveAuth    from './DriveAuth.js';
import ExportService from './ExportService.js';

const FOLDER_NAME     = 'All in Books';
const DRIVE_FILES_URL = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files';
const MAX_BACKUPS     = 4;

// ── ISO week helpers ──────────────────────────────────────────────────────────

/**
 * Returns the ISO 8601 week number (1–53) for a given Date.
 * Uses the standard algorithm: weeks start on Monday, week 1 contains Jan 4.
 * @param {Date} date
 * @returns {number}
 */
function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7)); // set to nearest Thursday
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86_400_000) + 1) / 7);
}

/**
 * Returns the ISO year for the ISO week (may differ from calendar year near year boundaries).
 * @param {Date} date
 * @returns {number}
 */
function getISOYear(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  return d.getUTCFullYear();
}

// ── BackupService ─────────────────────────────────────────────────────────────

const BackupService = {
  /**
   * Runs the full backup. Resolves with the Drive file ID of the uploaded backup.
   * @param {string} [bookId='main']
   * @returns {Promise<string>} Drive file ID
   */
  async run(bookId = 'main') {
    // 1. Validate connection and get a fresh token
    if (!DriveAuth.isConnected()) {
      throw new Error('BackupService: Google Drive is not connected. Call DriveAuth.connect() first.');
    }
    const token = await DriveAuth.getToken();

    // 2. Generate the xlsx buffer from all app data (hash is recorded in ExportService)
    const { buffer } = await ExportService.generate(bookId);

    // 3. Get or create the "All in Books" Drive folder
    const folderId = await this._getOrCreateFolder(token);

    // 4. Build the filename: AllInBooks_Backup_YYYY-Www.xlsx
    const now      = new Date();
    const week     = String(getISOWeek(now)).padStart(2, '0');
    const year     = getISOYear(now);
    const filename = `AllInBooks_Backup_${year}-W${week}.xlsx`;

    // 5. Upload the file (multipart upload)
    const fileId = await this._uploadFile(token, folderId, filename, buffer);

    // 6. Prune old backups (keep only MAX_BACKUPS most recent)
    await this._pruneOldBackups(token, folderId, MAX_BACKUPS);

    // 7. Record timestamp
    localStorage.setItem('lastBackupAt', String(Date.now()));

    return fileId;
  },

  /**
   * Returns true if today is Sunday AND more than 6 days have passed since the last backup.
   * Intended to be called from the useBackupSchedule hook on app open.
   * @returns {boolean}
   */
  shouldRunToday() {
    const last = parseInt(localStorage.getItem('lastBackupAt') || '0', 10);
    const now  = Date.now();
    const isWeeklyIntervalExceeded = (now - last) > 6 * 24 * 60 * 60 * 1000;
    const isSunday = new Date().getDay() === 0; // 0 = Sunday
    return isSunday && isWeeklyIntervalExceeded;
  },

  // ── Private helpers ─────────────────────────────────────────────────────────

  /**
   * Finds the "All in Books" folder in Drive, creates it if it doesn't exist.
   * Uses the drive.file scope: only folders created by this app are visible.
   * @param {string} token
   * @returns {Promise<string>} The folder's Drive ID
   * @private
   */
  async _getOrCreateFolder(token) {
    // List folders created by this app with the correct name
    const query  = encodeURIComponent(`mimeType='application/vnd.google-apps.folder' and name='${FOLDER_NAME}' and trashed=false`);
    const fields  = encodeURIComponent('files(id,name)');
    const listUrl = `${DRIVE_FILES_URL}?q=${query}&fields=${fields}&spaces=drive`;

    const listRes = await fetch(listUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!listRes.ok) {
      throw new Error(`BackupService: Failed to list Drive folders — ${listRes.statusText}`);
    }

    const listData = await listRes.json();

    if (listData.files && listData.files.length > 0) {
      return listData.files[0].id; // folder already exists
    }

    // Create the folder
    const createRes = await fetch(DRIVE_FILES_URL, {
      method: 'POST',
      headers: {
        Authorization:  `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name:     FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    });

    if (!createRes.ok) {
      throw new Error(`BackupService: Failed to create Drive folder — ${createRes.statusText}`);
    }

    const folder = await createRes.json();
    return folder.id;
  },

  /**
   * Uploads the xlsx buffer to the given Drive folder using multipart upload.
   * Overwrites any existing file with the same name in that folder.
   * @param {string} token
   * @param {string} folderId
   * @param {string} filename
   * @param {ArrayBuffer} buffer
   * @returns {Promise<string>} The created/updated Drive file ID
   * @private
   */
  async _uploadFile(token, folderId, filename, buffer) {
    const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    const metadata = JSON.stringify({
      name:    filename,
      parents: [folderId],
    });

    // Build multipart/related body manually (avoids FormData MIME edge cases)
    const boundary  = 'all_in_books_backup_boundary';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelim = `\r\n--${boundary}--`;

    const metaPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${metadata}`;
    const dataPart = `${delimiter}Content-Type: ${XLSX_MIME}\r\n\r\n`;

    // Encode everything as Uint8Array so binary xlsx data is preserved
    const encoder    = new TextEncoder();
    const metaBytes  = encoder.encode(metaPart);
    const dataBytes  = encoder.encode(dataPart);
    const closeBytes = encoder.encode(closeDelim);
    const xlsxBytes  = new Uint8Array(buffer);

    const body = new Uint8Array(
      metaBytes.length + dataBytes.length + xlsxBytes.length + closeBytes.length
    );
    let offset = 0;
    body.set(metaBytes,  offset); offset += metaBytes.length;
    body.set(dataBytes,  offset); offset += dataBytes.length;
    body.set(xlsxBytes,  offset); offset += xlsxBytes.length;
    body.set(closeBytes, offset);

    const uploadRes = await fetch(`${DRIVE_UPLOAD_URL}?uploadType=multipart&fields=id`, {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.json().catch(() => ({}));
      throw new Error(`BackupService: Drive upload failed — ${err.error?.message || uploadRes.statusText}`);
    }

    const result = await uploadRes.json();
    return result.id;
  },

  /**
   * Lists all xlsx files in the backup folder (sorted by creation time, oldest first)
   * and deletes any beyond the `keep` count.
   * @param {string} token
   * @param {string} folderId
   * @param {number} keep — number of most-recent files to retain
   * @returns {Promise<void>}
   * @private
   */
  async _pruneOldBackups(token, folderId, keep) {
    const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    const query     = encodeURIComponent(`'${folderId}' in parents and mimeType='${XLSX_MIME}' and trashed=false`);
    const fields    = encodeURIComponent('files(id,name,createdTime)');
    const orderBy   = encodeURIComponent('createdTime asc'); // oldest first
    const listUrl   = `${DRIVE_FILES_URL}?q=${query}&orderBy=${orderBy}&fields=${fields}`;

    const listRes = await fetch(listUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!listRes.ok) return; // non-fatal: pruning failure should not fail the backup

    const listData = await listRes.json();
    const files    = listData.files || [];

    if (files.length <= keep) return; // nothing to prune

    // Delete oldest files beyond the retention limit
    const toDelete = files.slice(0, files.length - keep);
    await Promise.all(
      toDelete.map(file =>
        fetch(`${DRIVE_FILES_URL}/${file.id}`, {
          method:  'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        })
      )
    );
  },
};

export default BackupService;
