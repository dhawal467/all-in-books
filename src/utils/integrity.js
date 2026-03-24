/**
 * Integrity utility for financial data tamper detection.
 * Uses HMAC-SHA256 to create and verify checksums on critical financial records.
 */

const SECRET_KEY = 'allinbooks-integrity-v1';

async function getSignatureKey() {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(SECRET_KEY),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode('allinbooks-salt'),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'HMAC', hash: 'SHA-256', length: 256 },
    false,
    ['sign', 'verify']
  );
}

export async function computeRecordHash(record, criticalFields) {
  const enc = new TextEncoder();
  const key = await getSignatureKey();
  
  const data = criticalFields
    .map(field => String(record[field] ?? ''))
    .join('|');
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    enc.encode(data)
  );
  
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

export async function verifyRecordHash(record, criticalFields) {
  if (!record._hash) return true;
  
  const computed = await computeRecordHash(record, criticalFields);
  return computed === record._hash;
}

export function markRecordTampered(record) {
  return { ...record, _tampered: true };
}

export const CRITICAL_FIELDS = {
  transaction: ['date', 'type', 'amount', 'partyId', 'gstAmount', 'baseAmount'],
  party: ['name', 'openingBalance'],
  invoice: ['partyId', 'subtotal', 'gstAmount', 'grandTotal']
};

export function setIntegrityStatus(hasWarning) {
  if (hasWarning) {
    localStorage.setItem('integrityWarning', 'true');
    sessionStorage.setItem('integrityWarning', 'true');
  } else {
    localStorage.removeItem('integrityWarning');
    sessionStorage.removeItem('integrityWarning');
  }
}

export function getIntegrityStatus() {
  return sessionStorage.getItem('integrityWarning') === 'true' || 
         localStorage.getItem('integrityWarning') === 'true';
}

export async function computeExportHash(data) {
  const enc = new TextEncoder();
  const dataStr = JSON.stringify(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', enc.encode(dataStr));
  return btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
}

export function getLastExportHash() {
  return localStorage.getItem('lastExportHash');
}

export function setLastExportHash(hash) {
  localStorage.setItem('lastExportHash', hash);
}
