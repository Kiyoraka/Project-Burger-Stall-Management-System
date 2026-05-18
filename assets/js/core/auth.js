/**
 * auth.js — Mock authentication layer for BSMS.
 *
 * Stateless against the server (everything lives in localStorage). Compares
 * plaintext passwords against seeded passwordHash strings since the prototype
 * intentionally skips real hashing.
 *
 * Session layout (localStorage `bsms.session`):
 *   {
 *     userId:    "adm-001" | "aff-001" | "sel-001",
 *     role:      "admin" | "affiliate" | "seller",
 *     email:     "...",
 *     name:      "...",
 *     loginAt:   ISO-8601,
 *     expiresAt: ISO-8601   // loginAt + 30 days
 *   }
 *
 * Surface:
 *   auth.login(role, email, password)  → record | null
 *   auth.logout()                      → void
 *   auth.currentUser()                 → record | null (also returns null if expired)
 *   auth.isAuthed()                    → boolean
 *   auth.requireRole(expectedRole)     → installed by Task 20
 *   auth.hasFlag(key)                  → boolean wrapper around db.flags.isEnabled
 *
 * Login dispatches `auth:change` CustomEvent on window with detail = the
 * session (or null on logout) so navbars can re-render.
 */
(function () {
  'use strict';

  const SESSION_KEY = 'bsms.session';
  const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
  const VALID_ROLES = ['admin', 'affiliate', 'seller'];

  function lsGet(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }

  function lsSet(key, value) {
    try { localStorage.setItem(key, value); return true; } catch (e) { return false; }
  }

  function lsRemove(key) {
    try { localStorage.removeItem(key); } catch (e) { /* ignore */ }
  }

  function fire(detail) {
    try {
      window.dispatchEvent(new CustomEvent('auth:change', { detail: detail }));
    } catch (e) { /* ignore */ }
  }

  function readSession() {
    const raw = lsGet(SESSION_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.userId || !parsed.role) return null;
      return parsed;
    } catch (e) {
      lsRemove(SESSION_KEY);
      return null;
    }
  }

  function isExpired(session) {
    if (!session || !session.expiresAt) return true;
    const expires = new Date(session.expiresAt).getTime();
    return !isFinite(expires) || expires <= Date.now();
  }

  function lookupByRole(role, email) {
    if (!email || !window.db) return null;
    const target = String(email).toLowerCase().trim();
    if (role === 'admin') {
      return window.db.admins && typeof window.db.admins.getByEmail === 'function'
        ? window.db.admins.getByEmail(target)
        : (window.db.admins.list().find(function (r) { return r.email && r.email.toLowerCase() === target; }) || null);
    }
    if (role === 'affiliate') {
      return window.db.affiliates.list().find(function (r) { return r.email && r.email.toLowerCase() === target; }) || null;
    }
    if (role === 'seller') {
      return window.db.users.list().find(function (r) { return r.email && r.email.toLowerCase() === target; }) || null;
    }
    return null;
  }

  const auth = {

    login: function (role, email, password) {
      if (VALID_ROLES.indexOf(role) === -1) return null;
      const record = lookupByRole(role, email);
      if (!record) return null;
      if (record.passwordHash !== password) return null;
      // Block suspended accounts at login time
      if (record.status === 'suspended') return null;

      const now = new Date();
      const session = {
        userId: record.id,
        role: role,
        email: record.email,
        name: record.name,
        loginAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + SESSION_TTL_MS).toISOString()
      };
      lsSet(SESSION_KEY, JSON.stringify(session));
      fire(session);
      return session;
    },

    logout: function () {
      lsRemove(SESSION_KEY);
      fire(null);
    },

    currentUser: function () {
      const session = readSession();
      if (!session) return null;
      if (isExpired(session)) {
        lsRemove(SESSION_KEY);
        return null;
      }
      // Hydrate fresh record data (so name/status updates surface without re-login)
      let record = null;
      if (window.db) {
        if (session.role === 'admin' && window.db.admins) record = window.db.admins.get(session.userId);
        else if (session.role === 'affiliate' && window.db.affiliates) record = window.db.affiliates.get(session.userId);
        else if (session.role === 'seller' && window.db.users) record = window.db.users.get(session.userId);
      }
      if (!record) {
        // Underlying record was deleted - kill session
        lsRemove(SESSION_KEY);
        return null;
      }
      return Object.assign({}, record, {
        role: session.role,
        loginAt: session.loginAt,
        expiresAt: session.expiresAt
      });
    },

    isAuthed: function () {
      return auth.currentUser() !== null;
    },

    hasFlag: function (key) {
      if (!window.db || !window.db.flags || typeof window.db.flags.isEnabled !== 'function') return false;
      return window.db.flags.isEnabled(key);
    },

    // requireRole: installed by Task 20 (auth-guard.js extension)
    requireRole: function () {
      console.warn('[bsms.auth] requireRole called but not yet installed (Phase 2 Task 20)');
    },

    // Constants surface for callers
    SESSION_TTL_MS: SESSION_TTL_MS,
    VALID_ROLES: VALID_ROLES.slice()
  };

  window.auth = auth;
})();
