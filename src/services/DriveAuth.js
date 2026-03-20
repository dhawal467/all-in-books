/**
 * DriveAuth.js
 * Google OAuth 2.0 Authorization Code flow with PKCE (no SDK, pure fetch).
 * Scope: drive.file only — access only to files created by this app.
 *
 * localStorage keys:
 *   drive_access_token   — current access token string
 *   drive_refresh_token  — long-lived refresh token
 *   drive_token_expiry   — epoch ms when access token expires
 *
 * sessionStorage keys (cleared after callback):
 *   pkce_verifier        — PKCE code verifier (temporary)
 */

const CLIENT_ID    = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const REDIRECT_URI = window.location.origin + '/auth/callback';
const SCOPES       = 'https://www.googleapis.com/auth/drive.file';
const TOKEN_URL    = 'https://oauth2.googleapis.com/token';
const AUTH_URL     = 'https://accounts.google.com/o/oauth2/v2/auth';

// ── PKCE helpers ─────────────────────────────────────────────────────────────

/**
 * Generates a cryptographically random 32-byte base64url string (PKCE verifier).
 * @returns {string}
 */
function generateVerifier() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64urlEncode(array);
}

/**
 * Computes a SHA-256 hash of the verifier and returns it as base64url (PKCE challenge).
 * @param {string} verifier
 * @returns {Promise<string>}
 */
async function sha256(verifier) {
  const encoder = new TextEncoder();
  const data    = encoder.encode(verifier);
  const digest  = await crypto.subtle.digest('SHA-256', data);
  return base64urlEncode(new Uint8Array(digest));
}

/**
 * Encodes a Uint8Array as base64url (no padding, URL-safe characters).
 * @param {Uint8Array} bytes
 * @returns {string}
 */
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
   * Generates PKCE challenge, stores verifier in sessionStorage, then navigates.
   */
  async connect() {
    const verifier  = generateVerifier();
    const challenge = await sha256(verifier);

    sessionStorage.setItem('pkce_verifier', verifier);

    const params = new URLSearchParams({
      client_id:             CLIENT_ID,
      redirect_uri:          REDIRECT_URI,
      response_type:         'code',
      scope:                 SCOPES,
      code_challenge:        challenge,
      code_challenge_method: 'S256',
      access_type:           'offline',
      prompt:                'consent',   // force refresh_token every time
    });

    window.location.href = `${AUTH_URL}?${params.toString()}`;
  },

  /**
   * Step 2 — Exchange the authorization code for tokens.
   * Called from /auth/callback after Google redirects back.
   * Stores access_token, refresh_token, and expiry in localStorage.
   * @param {string} code — The authorization code from the URL query string
   */
  async handleCallback(code) {
    const verifier = sessionStorage.getItem('pkce_verifier');
    if (!verifier) {
      throw new Error('DriveAuth: PKCE verifier missing from sessionStorage. The OAuth flow may have expired.');
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

    localStorage.setItem('drive_access_token',  tokens.access_token);
    localStorage.setItem('drive_token_expiry',  String(Date.now() + tokens.expires_in * 1000));
    if (tokens.refresh_token) {
      localStorage.setItem('drive_refresh_token', tokens.refresh_token);
    }

    // Clean up verifier — it is one-time-use only
    sessionStorage.removeItem('pkce_verifier');
  },

  /**
   * Returns a valid access token, refreshing if necessary.
   * Throws if the user has never connected (no refresh token).
   * @returns {Promise<string>}
   */
  async getToken() {
    const expiry = parseInt(localStorage.getItem('drive_token_expiry') || '0', 10);
    // Return cached token if it has more than 60 seconds remaining
    if (Date.now() < expiry - 60_000) {
      return localStorage.getItem('drive_access_token');
    }
    return this._refresh();
  },

  /**
   * Uses the stored refresh token to obtain a new access token.
   * @returns {Promise<string>}
   * @private
   */
  async _refresh() {
    const refreshToken = localStorage.getItem('drive_refresh_token');
    if (!refreshToken) {
      throw new Error('DriveAuth: No refresh token found. User must connect Google Drive first.');
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
      // Refresh token may have been revoked — clear stored credentials
      this.disconnect();
      const err = await res.json().catch(() => ({}));
      throw new Error(`DriveAuth: Token refresh failed — ${err.error_description || res.statusText}`);
    }

    const tokens = await res.json();

    localStorage.setItem('drive_access_token', tokens.access_token);
    localStorage.setItem('drive_token_expiry', String(Date.now() + tokens.expires_in * 1000));
    // Google only sends a new refresh_token if rotation is enabled; keep old one otherwise
    if (tokens.refresh_token) {
      localStorage.setItem('drive_refresh_token', tokens.refresh_token);
    }

    return tokens.access_token;
  },

  /**
   * Returns true if the user has previously connected Google Drive.
   * (A refresh token being present indicates a successful past auth.)
   * @returns {boolean}
   */
  isConnected() {
    return !!localStorage.getItem('drive_refresh_token');
  },

  /**
   * Clears all stored Drive credentials from localStorage.
   */
  disconnect() {
    localStorage.removeItem('drive_access_token');
    localStorage.removeItem('drive_refresh_token');
    localStorage.removeItem('drive_token_expiry');
  },
};

export default DriveAuth;
