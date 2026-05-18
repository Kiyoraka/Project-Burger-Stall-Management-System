/**
 * db.js — CRUD facade over localStorage for the BSMS prototype.
 *
 * Each entity namespace lives at window.db.<name>. All mutations dispatch a
 * `db:change` CustomEvent on window so Alpine components can re-render
 * reactively without polling.
 *
 * Surface (filled incrementally across Phase 2 Tasks 12-18):
 *   db.users      — sellers (list / get / create / update / approve / suspend / delete)
 *   db.affiliates — referral partners (Task 13)
 *   db.admins     — platform admins (Task 13)
 *   db.orders     — subscriptions (Task 14)
 *   db.products   — menu items (Task 15)
 *   db.leads      — incoming orders (Task 16)
 *   db.flags      — feature flags (Task 17)
 *   db.landings   — seller landing configs (Task 17)
 *   db._meta      — resetAll / exportJson / importJson / seedIfEmpty (Task 18)
 *
 * Filter conventions: list({ status, sellerId, affiliateId, search }) - all
 * filters optional, AND-composed. Search is case-insensitive substring on
 * name/email/stallName fields.
 */
(function () {
  'use strict';

  // ---------- Storage helpers ----------

  function read(collection) {
    try {
      const raw = localStorage.getItem('bsms.' + collection);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('[bsms.db] read error', collection, e);
      return [];
    }
  }

  function write(collection, arr) {
    try {
      localStorage.setItem('bsms.' + collection, JSON.stringify(arr));
      return true;
    } catch (e) {
      console.error('[bsms.db] write error', collection, e);
      return false;
    }
  }

  function fire(collection, action, payload) {
    try {
      window.dispatchEvent(new CustomEvent('db:change', {
        detail: { collection: collection, action: action, payload: payload || null }
      }));
    } catch (e) { /* IE-ish or detached - ignore */ }
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function nextId(prefix, existing) {
    const used = (existing || []).map(function (r) {
      const m = r && r.id && r.id.match(new RegExp('^' + prefix + '-(\\d+)$'));
      return m ? parseInt(m[1], 10) : 0;
    });
    const max = used.length ? Math.max.apply(null, used) : 0;
    return prefix + '-' + String(max + 1).padStart(3, '0');
  }

  function applyFilters(rows, filters) {
    if (!filters) return rows;
    let out = rows;
    if (filters.status) {
      out = out.filter(function (r) { return r.status === filters.status; });
    }
    if (filters.sellerId) {
      out = out.filter(function (r) { return r.sellerId === filters.sellerId; });
    }
    if (filters.affiliateId) {
      out = out.filter(function (r) { return r.affiliateId === filters.affiliateId; });
    }
    if (filters.search) {
      const q = String(filters.search).toLowerCase().trim();
      if (q) {
        out = out.filter(function (r) {
          return (r.name && r.name.toLowerCase().indexOf(q) !== -1) ||
                 (r.email && r.email.toLowerCase().indexOf(q) !== -1) ||
                 (r.stallName && r.stallName.toLowerCase().indexOf(q) !== -1);
        });
      }
    }
    return out;
  }

  // ---------- users (sellers) ----------

  const users = {
    list: function (filters) {
      return applyFilters(read('users'), filters);
    },

    get: function (id) {
      const rows = read('users');
      for (let i = 0; i < rows.length; i++) {
        if (rows[i].id === id) return rows[i];
      }
      return null;
    },

    create: function (data) {
      const rows = read('users');
      const id = nextId('sel', rows);
      const record = Object.assign({
        id: id,
        email: '',
        passwordHash: 'seller123',
        name: '',
        phone: '',
        stallName: '',
        slug: '',
        status: 'pending',
        subscriptionId: null,
        affiliateId: null,
        createdAt: nowIso(),
        approvedAt: null
      }, data || {}, { id: id });
      rows.push(record);
      write('users', rows);
      fire('users', 'create', record);
      return record;
    },

    update: function (id, patch) {
      const rows = read('users');
      let updated = null;
      for (let i = 0; i < rows.length; i++) {
        if (rows[i].id === id) {
          rows[i] = Object.assign({}, rows[i], patch || {}, { id: id });
          updated = rows[i];
          break;
        }
      }
      if (updated) {
        write('users', rows);
        fire('users', 'update', updated);
      }
      return updated;
    },

    approve: function (id) {
      return users.update(id, {
        status: 'active',
        approvedAt: nowIso()
      });
    },

    suspend: function (id) {
      return users.update(id, { status: 'suspended' });
    },

    delete: function (id) {
      const rows = read('users');
      const next = rows.filter(function (r) { return r.id !== id; });
      if (next.length === rows.length) return false;
      write('users', next);
      fire('users', 'delete', { id: id });
      return true;
    }
  };

  // ---------- Public surface ----------

  window.db = {
    users: users,
    // Filled by subsequent tasks:
    affiliates: null,
    admins: null,
    orders: null,
    products: null,
    leads: null,
    flags: null,
    landings: null,
    _meta: null,
    // Internal helpers reused by other namespaces
    _internal: {
      read: read,
      write: write,
      fire: fire,
      nowIso: nowIso,
      nextId: nextId,
      applyFilters: applyFilters
    }
  };
})();
