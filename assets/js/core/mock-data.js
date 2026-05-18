/**
 * mock-data.js — Seed bootstrap for BSMS localStorage.
 *
 * Loads /assets/data/seed.json once per browser (gated by bsms.seeded flag)
 * and writes each entity array to its own localStorage key under the bsms.*
 * namespace. Idempotent — safe to call on every page load.
 *
 * Surface:
 *   await window.mockData.bootstrap()  → resolves true after seed is in place
 *   window.mockData.isSeeded()         → boolean
 *   window.mockData.resetAndReseed()   → wipes all bsms.* keys and re-fetches
 *
 * Storage layout (one key per collection):
 *   bsms.seeded       → "1" when initial seed complete
 *   bsms.version      → schema version copied from seed.json
 *   bsms.admins       → JSON array
 *   bsms.affiliates   → JSON array
 *   bsms.users        → JSON array  (sellers, schema calls them users)
 *   bsms.orders       → JSON array  (subscriptions)
 *   bsms.products     → JSON array
 *   bsms.leads        → JSON array
 *   bsms.flags        → JSON array
 *   bsms.landings     → JSON array
 *
 * Notes:
 * - fetch(seed.json) requires HTTP server - file:// will reject (documented in README)
 * - Each collection lives in its own key so individual updates avoid rewriting the entire dataset
 * - The bsms.seeded flag prevents accidental overwrite when user has made local changes
 */
(function () {
  'use strict';

  const SEED_URL = '/assets/data/seed.json';
  const SEEDED_KEY = 'bsms.seeded';
  const VERSION_KEY = 'bsms.version';
  const COLLECTIONS = ['admins', 'affiliates', 'users', 'orders', 'products', 'leads', 'flags', 'landings'];

  let inflight = null;

  function lsGet(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }

  function lsSet(key, value) {
    try { localStorage.setItem(key, value); return true; } catch (e) { return false; }
  }

  function lsRemove(key) {
    try { localStorage.removeItem(key); } catch (e) { /* ignore */ }
  }

  function writeCollection(name, arr) {
    lsSet('bsms.' + name, JSON.stringify(Array.isArray(arr) ? arr : []));
  }

  function clearAll() {
    lsRemove(SEEDED_KEY);
    lsRemove(VERSION_KEY);
    COLLECTIONS.forEach(function (name) { lsRemove('bsms.' + name); });
    lsRemove('bsms.session');
    lsRemove('bsms.notifications.unread');
  }

  function applySeed(json) {
    if (!json || typeof json !== 'object') {
      throw new Error('mock-data: seed.json malformed');
    }
    lsSet(VERSION_KEY, String(json.version || 1));
    COLLECTIONS.forEach(function (name) {
      writeCollection(name, json[name] || []);
    });
    lsSet(SEEDED_KEY, '1');
    return true;
  }

  function fetchSeed() {
    if (typeof fetch !== 'function') {
      return Promise.reject(new Error('mock-data: fetch unavailable'));
    }
    return fetch(SEED_URL, { cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) throw new Error('mock-data: seed.json ' + res.status + ' ' + res.statusText);
        return res.json();
      });
  }

  function bootstrap() {
    if (lsGet(SEEDED_KEY) === '1') {
      return Promise.resolve(true);
    }
    if (inflight) return inflight;

    inflight = fetchSeed()
      .then(applySeed)
      .catch(function (err) {
        console.error('[bsms] mock-data bootstrap failed:', err && err.message);
        inflight = null;
        throw err;
      });

    return inflight;
  }

  function resetAndReseed() {
    clearAll();
    inflight = null;
    return bootstrap();
  }

  window.mockData = {
    bootstrap: bootstrap,
    isSeeded: function () { return lsGet(SEEDED_KEY) === '1'; },
    resetAndReseed: resetAndReseed,
    _clearAll: clearAll,
    COLLECTIONS: COLLECTIONS.slice()
  };

  // Auto-bootstrap on script load - non-blocking, db.js can re-await
  bootstrap().catch(function () { /* surfaced via console.error already */ });
})();
