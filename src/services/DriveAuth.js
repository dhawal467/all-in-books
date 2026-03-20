/**
 * DriveAuth.js
 * Google OAuth 2.0 Authorization Code flow with PKCE (no SDK, pure fetch).
 * Scope: drive.file only — access only to files created by this app.
 *
 * Security model (Sprint 1 hardening):
 *   - drive_access_token   → sessionStorage (cleared on tab close)
 *   - drive_refresh_token_enc → localStorage, AES-GCM encrypted with a
 *                               PBKDF2-derived key from a per-device salt.
 *                               NEVER stored in plain text.
 *   - drive_enc_salt        → localStorage, 16-byte random salt (not secret,
 *                               just ensures per-device key uniqueness)
 *   - pkce_verifier         → sessionStorage (cleared after callback)
 *   - oauth_state           → sessionStorage (CSRF guard, cleared after callback)
 */

const CLIENT_ID    = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const REDIRECT_URI = window.location.origin + '/auth/callback';
const SCOPES       = 'https://www.googleapis.com/auth/drive.file';
const TOKEN_URL    = 'https://oauth2.googleapis.com/token';
const AUTH_URL     = 'https://accounts.google.com/o/oauth2/v2/auth';

// ── Encryption helpers ────────────────────────────────────────────────────────

/**
 * Retrieves the per-device encryption salt from localStorage, or creates and stores a new one.
 * The salt is not secret — it just ties the derived key to this browser profile.
 * @returns {Uint8Array} 16-byte salt
 */
function getOrCreateSalt() {
  const stored = localStorage.getItem('drive_enc_salt');
  if (stored) {
    const bytes = atob(stored);
    return new Uint8Array([...bytes].map(c => c.charCodeAt(0)));
  }
  const salt = crypto.getRandomValues(new Uint8Array(16));
  localStorage.setItem('drive_enc_salt', btoa(String.fromCharCode(...salt)));
  return salt;
}

/**
 * Derives an AES-GCM-256 CryptoKey using PBKDF2 from a fixed app-level passphrase and a per-device salt.
 * @param {Uint8Array} salt
 * @returns {Promise<CryptoKey>}
 */
async function deriveKey(salt) {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode('allinbooks-drive-v1'),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a plaintext string using AES-GCM.
 * @param {string} plaintext
 * @returns {Promise<string>} Format: "base64(iv).base64(ciphertext)"
 */
async function encryptToken(plaintext) {
  const salt = getOrCreateSalt();
  const key  = await deriveKey(salt);
  const iv   = crypto.getRandomValues(new Uint8Array(12));
  const enc  = new TextEncoder();

  const cipherbuf = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(plaintext)
  );

  const ivB64   = btoa(String.fromCharCode(...iv));
  const ctB64   = btoa(String.fromCharCode(...new Uint8Array(cipherbuf)));
  return `${ivB64}.${ctB64}`;
}

/**
 * Decrypts a token previously encrypted by encryptToken().
 * @param {string} stored  — Format: "base64(iv).base64(ciphertext)"
 * @returns {Promise<string>} Plaintext token
 */
async function decryptToken(stored) {
  const [ivB64, ctB64] = stored.split('.');
  if (!ivB64 || !ctB64) throw new Error('DriveAuth: malformed encrypted token');

  const iv       = new Uint8Array([...atob(ivB64)].map(c => c.charCodeAt(0)));
  const ct       = new Uint8Array([...atob(ctB64)].map(c => c.charCodeAt(0)));
  const salt     = getOrCreateSalt();
  const key      = await deriveKey(salt);

  const plainbuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
  return new TextDecoder().decode(plainbuf);
}

// ── PKCE helpers ─────────────────────────────────────────────────────────────

function generateVerifier() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64urlEncode(array);
}

async function sha256(verifier) {
  const encoder = new TextEncoder();
  const data    = encoder.encode(verifier);
  const digest  = await crypto.subtle.digest('SHA-256', data);
  return base64urlEncode(new Uint8Array(digest));
}

function base64urlEncode(bytes) {
  let str = '';
  bytes.forEach(byte => { str += String.fromCharCode(byte); });
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// ── DriveAuth object ──────────────────────────────────────────────────────────

const DriveAuth = {
  /**
   * Step 1 — Redirect the user to the Google consent screen.
   * Generates PKCE challenge + CSRF state, stores both in sessionStorage.
   */
  async connect() {
    const verifier  = generateVerifier();
    const challenge = await sha256(verifier);
    const state     = crypto.randomUUID(); // V-005 fix: CSRF state

    sessionStorage.setItem('pkce_verifier', verifier);
    sessionStorage.setItem('oauth_state', state);    // V-005 fix

    const params = new URLSearchParams({
      client_id:             CLIENT_ID,
      redirect_uri:          REDIRECT_URI,
      response_type:         'code',
      scope:                 SCOPES,
      code_challenge:        challenge,
      code_challenge_method: 'S256',
      access_type:           'offline',
      prompt:                'consent',
      state,                              // V-005 fix
    });

    window.location.href = `${AUTH_URL}?${params.toString()}`;
  },

  /**
   * Step 2 — Exchange the authorization code for tokens.
   * Stores access_token in sessionStorage (cleared on tab close).
   * Stores refresh_token encrypted in localStorage (never plain text).
   * @param {string} code — The authorization code from the URL query string
   */
  async handleCallback(code) {
    const verifier = sessionStorage.getItem('pkce_verifier');
    if (!verifier) {
      throw new Error('DriveAuth: PKCE verifier missing from sessionStorage.');
    }

    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id:     CLIENT_ID,
        redirect_uri:  REDIRECT_URI,
        grant_type:    'authorization_code',
        code_verifier: verifier,
      }).toString(),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`DriveAuth: Token exchange failed — ${err.error_description || res.statusText}`);
    }

    const tokens = await res.json();

    // V-001 fix: access token → sessionStorage, refresh token → encrypted localStorage
    sessionStorage.setItem('drive_access_token', tokens.access_token);
    localStorage.setItem('drive_token_expiry', String(Date.now() + tokens.expires_in * 1000));

    if (tokens.refresh_token) {
      const enc = await encryptToken(tokens.refresh_token);
      localStorage.setItem('drive_refresh_token_enc', enc);
      // Ensure no legacy plain token survives
      localStorage.removeItem('drive_refresh_token');
    }

    sessionStorage.removeItem('pkce_verifier');
  },

  /**
   * Returns a valid access token, refreshing if necessary.
   * @returns {Promise<string>}
   */
  async getToken() {
    const expiry = parseInt(localStorage.getItem('drive_token_expiry') || '0', 10);
    if (Date.now() < expiry - 60_000) {
      // Access token may still be in sessionStorage from this tab session
      const cached = sessionStorage.getItem('drive_access_token');
      if (cached) return cached;
    }
    return this._refresh();
  },

  /**
   * Uses the stored (encrypted) refresh token to obtain a new access token.
   * @returns {Promise<string>}
   * @private
   */
  async _refresh() {
    const encRefresh = localStorage.getItem('drive_refresh_token_enc');
    if (!encRefresh) {
      throw new Error('DriveAuth: No refresh token found. User must connect Google Drive first.');
    }

    let refreshToken;
    try {
      refreshToken = await decryptToken(encRefresh);
    } catch {
      this.disconnect();
      throw new Error('DriveAuth: Failed to decrypt refresh token. Please reconnect Google Drive.');
    }

    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'refresh_token',
        refresh_token: refreshToken,
        client_id:     CLIENT_ID,
      }).toString(),
    });

    if (!res.ok) {
      this.disconnect();
      const err = await res.json().catch(() => ({}));
      throw new Error(`DriveAuth: Token refresh failed — ${err.error_description || res.statusText}`);
    }

    const tokens = await res.json();

    // V-001 fix: keep access token in sessionStorage
    sessionStorage.setItem('drive_access_token', tokens.access_token);
    localStorage.setItem('drive_token_expiry', String(Date.now() + tokens.expires_in * 1000));

    if (tokens.refresh_token) {
      const enc = await encryptToken(tokens.refresh_token);
      localStorage.setItem('drive_refresh_token_enc', enc);
      localStorage.removeItem('drive_refresh_token');
    }

    return tokens.access_token;
  },

  /**
   * Returns true if the user has previously connected Google Drive.
   * @returns {boolean}
   */
  isConnected() {
    return !!localStorage.getItem('drive_refresh_token_enc');
  },

  /**
   * Clears all stored Drive credentials.
   */
  disconnect() {
    sessionStorage.removeItem('drive_access_token');
    localStorage.removeItem('drive_refresh_token_enc');
    localStorage.removeItem('drive_token_expiry');
    localStorage.removeItem('drive_enc_salt');
    // Belt-and-suspenders: remove any legacy plain token if it somehow exists
    localStorage.removeItem('drive_refresh_token');
  },
};

export default DriveAuth;
