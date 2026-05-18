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

  // ---------- affiliates ----------

  const affiliates = {
    list: function (filters) {
      return applyFilters(read('affiliates'), filters);
    },

    get: function (id) {
      const rows = read('affiliates');
      for (let i = 0; i < rows.length; i++) {
        if (rows[i].id === id) return rows[i];
      }
      return null;
    },

    getByReferralCode: function (code) {
      if (!code) return null;
      const rows = read('affiliates');
      const target = String(code).toLowerCase();
      for (let i = 0; i < rows.length; i++) {
        if (rows[i].referralCode && rows[i].referralCode.toLowerCase() === target) {
          return rows[i];
        }
      }
      return null;
    },

    create: function (data) {
      const rows = read('affiliates');
      const id = nextId('aff', rows);
      const record = Object.assign({
        id: id,
        email: '',
        passwordHash: 'aff123',
        name: '',
        phone: '',
        referralCode: '',
        bankName: null,
        bankAccount: null,
        commissionRate: 0.15,
        totalEarned: 0,
        totalPaid: 0,
        status: 'active',
        createdAt: nowIso()
      }, data || {}, { id: id });
      rows.push(record);
      write('affiliates', rows);
      fire('affiliates', 'create', record);
      return record;
    },

    update: function (id, patch) {
      const rows = read('affiliates');
      let updated = null;
      for (let i = 0; i < rows.length; i++) {
        if (rows[i].id === id) {
          rows[i] = Object.assign({}, rows[i], patch || {}, { id: id });
          updated = rows[i];
          break;
        }
      }
      if (updated) {
        write('affiliates', rows);
        fire('affiliates', 'update', updated);
      }
      return updated;
    },

    suspend: function (id) {
      return affiliates.update(id, { status: 'suspended' });
    }
  };

  // ---------- admins ----------

  const admins = {
    list: function (filters) {
      return applyFilters(read('admins'), filters);
    },

    get: function (id) {
      const rows = read('admins');
      for (let i = 0; i < rows.length; i++) {
        if (rows[i].id === id) return rows[i];
      }
      return null;
    },

    getByEmail: function (email) {
      if (!email) return null;
      const rows = read('admins');
      const target = String(email).toLowerCase();
      for (let i = 0; i < rows.length; i++) {
        if (rows[i].email && rows[i].email.toLowerCase() === target) {
          return rows[i];
        }
      }
      return null;
    }
  };

  // ---------- orders (subscriptions) ----------

  const PLAN_PRICE = 49;
  const SUB_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

  const orders = {
    list: function (filters) {
      const rows = read('orders');
      if (!filters) return rows.slice().sort(byCreatedDesc);
      let out = rows;
      if (filters.sellerId) {
        out = out.filter(function (r) { return r.sellerId === filters.sellerId; });
      }
      if (filters.affiliateId) {
        out = out.filter(function (r) { return r.affiliateId === filters.affiliateId; });
      }
      if (filters.status) {
        out = out.filter(function (r) { return r.status === filters.status; });
      }
      if (filters.startDate) {
        const after = new Date(filters.startDate).getTime();
        out = out.filter(function (r) { return r.createdAt && new Date(r.createdAt).getTime() >= after; });
      }
      if (filters.endDate) {
        const before = new Date(filters.endDate).getTime();
        out = out.filter(function (r) { return r.createdAt && new Date(r.createdAt).getTime() <= before; });
      }
      if (filters.search) {
        const q = String(filters.search).toLowerCase().trim();
        if (q) {
          out = out.filter(function (r) {
            return (r.id && r.id.toLowerCase().indexOf(q) !== -1) ||
                   (r.paymentRef && r.paymentRef.toLowerCase().indexOf(q) !== -1);
          });
        }
      }
      return out.slice().sort(byCreatedDesc);
    },

    get: function (id) {
      const rows = read('orders');
      for (let i = 0; i < rows.length; i++) {
        if (rows[i].id === id) return rows[i];
      }
      return null;
    },

    activeForSeller: function (sellerId) {
      if (!sellerId) return null;
      const rows = read('orders');
      for (let i = 0; i < rows.length; i++) {
        if (rows[i].sellerId === sellerId && rows[i].status === 'active') return rows[i];
      }
      return null;
    },

    create: function (data) {
      const rows = read('orders');
      const id = nextId('ord', rows);
      const affiliateId = (data && data.affiliateId) || null;
      const rate = affiliateId ? lookupAffiliateRate(affiliateId) : 0;
      const amount = (data && data.amount) || PLAN_PRICE;
      const record = Object.assign({
        id: id,
        sellerId: null,
        plan: 'Standard',
        amount: amount,
        status: 'pending',
        startDate: null,
        endDate: null,
        paymentMethod: 'Online Banking',
        paymentRef: null,
        affiliateId: affiliateId,
        commissionAmount: parseFloat((amount * rate).toFixed(2)),
        createdAt: nowIso()
      }, data || {}, { id: id });
      rows.push(record);
      write('orders', rows);
      fire('orders', 'create', record);
      return record;
    },

    activate: function (id) {
      const start = new Date();
      const end = new Date(start.getTime() + SUB_DURATION_MS);
      return updateOrder(id, {
        status: 'active',
        startDate: start.toISOString(),
        endDate: end.toISOString()
      });
    },

    expire: function (id) {
      return updateOrder(id, { status: 'expired' });
    },

    cancel: function (id) {
      return updateOrder(id, { status: 'cancelled' });
    }
  };

  function byCreatedDesc(a, b) {
    const at = a && a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bt = b && b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bt - at;
  }

  function lookupAffiliateRate(affiliateId) {
    const aff = read('affiliates').find(function (a) { return a.id === affiliateId; });
    return aff && typeof aff.commissionRate === 'number' ? aff.commissionRate : 0.15;
  }

  function updateOrder(id, patch) {
    const rows = read('orders');
    let updated = null;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].id === id) {
        rows[i] = Object.assign({}, rows[i], patch || {}, { id: id });
        updated = rows[i];
        break;
      }
    }
    if (updated) {
      write('orders', rows);
      fire('orders', 'update', updated);
    }
    return updated;
  }

  // ---------- products (menu items) ----------

  const PRODUCT_CATEGORIES = ['burger', 'sides', 'drinks', 'combo'];

  const products = {
    categories: PRODUCT_CATEGORIES.slice(),

    listBySeller: function (sellerId, filters) {
      if (!sellerId) return [];
      let out = read('products').filter(function (p) { return p.sellerId === sellerId; });
      if (filters && filters.category) {
        out = out.filter(function (p) { return p.category === filters.category; });
      }
      if (filters && typeof filters.available === 'boolean') {
        out = out.filter(function (p) { return !!p.available === filters.available; });
      }
      if (filters && filters.search) {
        const q = String(filters.search).toLowerCase().trim();
        if (q) {
          out = out.filter(function (p) {
            return (p.name && p.name.toLowerCase().indexOf(q) !== -1) ||
                   (p.description && p.description.toLowerCase().indexOf(q) !== -1);
          });
        }
      }
      return out.sort(function (a, b) {
        const ao = typeof a.sortOrder === 'number' ? a.sortOrder : 999;
        const bo = typeof b.sortOrder === 'number' ? b.sortOrder : 999;
        return ao - bo;
      });
    },

    get: function (id) {
      const rows = read('products');
      for (let i = 0; i < rows.length; i++) {
        if (rows[i].id === id) return rows[i];
      }
      return null;
    },

    create: function (data) {
      const rows = read('products');
      const id = nextId('prd', rows);
      const sellerId = data && data.sellerId;
      const sellerRows = sellerId ? rows.filter(function (p) { return p.sellerId === sellerId; }) : [];
      const nextSortOrder = sellerRows.length
        ? Math.max.apply(null, sellerRows.map(function (p) { return p.sortOrder || 0; })) + 1
        : 1;
      const record = Object.assign({
        id: id,
        sellerId: null,
        name: '',
        description: '',
        price: 0,
        imageUrl: '',
        category: 'burger',
        available: true,
        sortOrder: nextSortOrder,
        createdAt: nowIso()
      }, data || {}, { id: id });
      rows.push(record);
      write('products', rows);
      fire('products', 'create', record);
      return record;
    },

    update: function (id, patch) {
      const rows = read('products');
      let updated = null;
      for (let i = 0; i < rows.length; i++) {
        if (rows[i].id === id) {
          rows[i] = Object.assign({}, rows[i], patch || {}, { id: id });
          updated = rows[i];
          break;
        }
      }
      if (updated) {
        write('products', rows);
        fire('products', 'update', updated);
      }
      return updated;
    },

    delete: function (id) {
      const rows = read('products');
      const next = rows.filter(function (p) { return p.id !== id; });
      if (next.length === rows.length) return false;
      write('products', next);
      fire('products', 'delete', { id: id });
      return true;
    },

    reorder: function (sellerId, orderedIds) {
      if (!sellerId || !Array.isArray(orderedIds)) return false;
      const rows = read('products');
      const indexMap = {};
      orderedIds.forEach(function (id, i) { indexMap[id] = i + 1; });
      let changed = false;
      for (let i = 0; i < rows.length; i++) {
        if (rows[i].sellerId === sellerId && indexMap.hasOwnProperty(rows[i].id)) {
          if (rows[i].sortOrder !== indexMap[rows[i].id]) {
            rows[i].sortOrder = indexMap[rows[i].id];
            changed = true;
          }
        }
      }
      if (changed) {
        write('products', rows);
        fire('products', 'reorder', { sellerId: sellerId, orderedIds: orderedIds });
      }
      return changed;
    }
  };

  // ---------- leads (incoming orders) ----------

  const LEAD_STATUSES = ['new', 'contacted', 'fulfilled', 'lost'];
  const LEAD_SOURCES = ['whatsapp', 'call', 'walkin'];

  const leads = {
    statuses: LEAD_STATUSES.slice(),
    sources: LEAD_SOURCES.slice(),

    listBySeller: function (sellerId, filters) {
      if (!sellerId) return [];
      let out = read('leads').filter(function (l) { return l.sellerId === sellerId; });
      if (filters && filters.status) {
        out = out.filter(function (l) { return l.status === filters.status; });
      }
      if (filters && filters.source) {
        out = out.filter(function (l) { return l.source === filters.source; });
      }
      if (filters && filters.search) {
        const q = String(filters.search).toLowerCase().trim();
        if (q) {
          out = out.filter(function (l) {
            return (l.customerName && l.customerName.toLowerCase().indexOf(q) !== -1) ||
                   (l.customerPhone && l.customerPhone.indexOf(q) !== -1) ||
                   (l.notes && l.notes.toLowerCase().indexOf(q) !== -1);
          });
        }
      }
      return out.sort(function (a, b) {
        const at = a.receivedAt ? new Date(a.receivedAt).getTime() : 0;
        const bt = b.receivedAt ? new Date(b.receivedAt).getTime() : 0;
        return bt - at;
      });
    },

    listAllAcrossSellers: function (filters) {
      // For admin/dashboard Today's Leads cross-seller count
      let out = read('leads');
      if (filters && filters.since) {
        const after = new Date(filters.since).getTime();
        out = out.filter(function (l) {
          return l.receivedAt && new Date(l.receivedAt).getTime() >= after;
        });
      }
      return out;
    },

    get: function (id) {
      const rows = read('leads');
      for (let i = 0; i < rows.length; i++) {
        if (rows[i].id === id) return rows[i];
      }
      return null;
    },

    create: function (data) {
      const rows = read('leads');
      const id = nextId('led', rows);
      const items = (data && Array.isArray(data.items)) ? data.items : [];
      const totalAmount = (data && typeof data.totalAmount === 'number')
        ? data.totalAmount
        : items.reduce(function (sum, it) {
            return sum + ((it.priceAtOrder || 0) * (it.qty || 0));
          }, 0);
      const record = Object.assign({
        id: id,
        sellerId: null,
        customerName: '',
        customerPhone: '',
        items: items,
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        notes: '',
        source: 'whatsapp',
        status: 'new',
        receivedAt: nowIso()
      }, data || {}, { id: id, items: items, totalAmount: parseFloat(totalAmount.toFixed(2)) });
      rows.push(record);
      write('leads', rows);
      fire('leads', 'create', record);
      return record;
    },

    updateStatus: function (id, status) {
      if (LEAD_STATUSES.indexOf(status) === -1) return null;
      const rows = read('leads');
      let updated = null;
      for (let i = 0; i < rows.length; i++) {
        if (rows[i].id === id) {
          rows[i] = Object.assign({}, rows[i], { status: status });
          updated = rows[i];
          break;
        }
      }
      if (updated) {
        write('leads', rows);
        fire('leads', 'update', updated);
      }
      return updated;
    }
  };

  // ---------- flags (feature flags) ----------

  const flags = {
    list: function () {
      return read('flags').slice();
    },

    get: function (key) {
      const rows = read('flags');
      for (let i = 0; i < rows.length; i++) {
        if (rows[i].key === key) return rows[i];
      }
      return null;
    },

    isEnabled: function (key) {
      const flag = flags.get(key);
      return !!(flag && flag.enabled);
    },

    toggle: function (key, updatedBy) {
      const rows = read('flags');
      let updated = null;
      for (let i = 0; i < rows.length; i++) {
        if (rows[i].key === key) {
          rows[i] = Object.assign({}, rows[i], {
            enabled: !rows[i].enabled,
            updatedAt: nowIso(),
            updatedBy: updatedBy || rows[i].updatedBy || null
          });
          updated = rows[i];
          break;
        }
      }
      if (updated) {
        write('flags', rows);
        fire('flags', 'toggle', updated);
      }
      return updated;
    },

    set: function (key, enabled, updatedBy) {
      const rows = read('flags');
      let updated = null;
      for (let i = 0; i < rows.length; i++) {
        if (rows[i].key === key) {
          rows[i] = Object.assign({}, rows[i], {
            enabled: !!enabled,
            updatedAt: nowIso(),
            updatedBy: updatedBy || rows[i].updatedBy || null
          });
          updated = rows[i];
          break;
        }
      }
      if (updated) {
        write('flags', rows);
        fire('flags', 'set', updated);
      }
      return updated;
    }
  };

  // ---------- landings (seller landing configs) ----------

  const landings = {
    getBySellerId: function (sellerId) {
      if (!sellerId) return null;
      const rows = read('landings');
      for (let i = 0; i < rows.length; i++) {
        if (rows[i].sellerId === sellerId) return rows[i];
      }
      return null;
    },

    getBySlug: function (slug) {
      if (!slug) return null;
      const sellers = read('users');
      const slugLower = String(slug).toLowerCase();
      const seller = sellers.find(function (s) {
        return s.slug && s.slug.toLowerCase() === slugLower;
      });
      if (!seller) return null;
      const landing = landings.getBySellerId(seller.id);
      return landing ? Object.assign({}, landing, { seller: seller }) : null;
    },

    update: function (sellerId, patch) {
      if (!sellerId) return null;
      const rows = read('landings');
      let updated = null;
      let found = false;
      for (let i = 0; i < rows.length; i++) {
        if (rows[i].sellerId === sellerId) {
          rows[i] = Object.assign({}, rows[i], patch || {}, { sellerId: sellerId });
          updated = rows[i];
          found = true;
          break;
        }
      }
      if (!found) {
        const created = Object.assign({
          sellerId: sellerId,
          themeColor: 'orange',
          heroImage: '',
          hours: { mon: 'closed', tue: 'closed', wed: 'closed', thu: 'closed', fri: 'closed', sat: 'closed', sun: 'closed' },
          address: '',
          mapsUrl: '',
          whatsappNumber: '',
          callNumber: '',
          tagline: '',
          aboutText: '',
          socialLinks: { fb: '', ig: '', tiktok: '' }
        }, patch || {}, { sellerId: sellerId });
        rows.push(created);
        updated = created;
      }
      write('landings', rows);
      fire('landings', found ? 'update' : 'create', updated);
      return updated;
    },

    isSlugTaken: function (slug, excludeSellerId) {
      if (!slug) return false;
      const sellers = read('users');
      const slugLower = String(slug).toLowerCase();
      return sellers.some(function (s) {
        return s.slug && s.slug.toLowerCase() === slugLower && s.id !== excludeSellerId;
      });
    }
  };

  // ---------- _meta (export / import / reset) ----------

  const COLLECTIONS = ['admins', 'affiliates', 'users', 'orders', 'products', 'leads', 'flags', 'landings'];

  const _meta = {
    collections: COLLECTIONS.slice(),

    exportJson: function () {
      const out = {
        version: parseInt(localStorage.getItem('bsms.version') || '1', 10),
        exportedAt: nowIso()
      };
      COLLECTIONS.forEach(function (name) {
        out[name] = read(name);
      });
      return JSON.stringify(out, null, 2);
    },

    importJson: function (jsonString) {
      let parsed;
      try {
        parsed = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
      } catch (e) {
        throw new Error('db._meta.importJson: invalid JSON - ' + (e && e.message));
      }
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('db._meta.importJson: payload must be an object');
      }
      COLLECTIONS.forEach(function (name) {
        if (Array.isArray(parsed[name])) {
          write(name, parsed[name]);
        }
      });
      if (parsed.version) {
        try { localStorage.setItem('bsms.version', String(parsed.version)); } catch (e) {}
      }
      try { localStorage.setItem('bsms.seeded', '1'); } catch (e) {}
      fire('_meta', 'import', { collections: COLLECTIONS.slice() });
      return true;
    },

    resetAll: function () {
      if (window.mockData && typeof window.mockData.resetAndReseed === 'function') {
        fire('_meta', 'reset', null);
        return window.mockData.resetAndReseed();
      }
      return Promise.reject(new Error('db._meta.resetAll: mock-data not loaded'));
    },

    seedIfEmpty: function () {
      if (window.mockData && typeof window.mockData.bootstrap === 'function') {
        return window.mockData.bootstrap();
      }
      return Promise.resolve(false);
    },

    counts: function () {
      const out = {};
      COLLECTIONS.forEach(function (name) {
        out[name] = read(name).length;
      });
      return out;
    }
  };

  // ---------- Public surface ----------

  window.db = {
    users: users,
    affiliates: affiliates,
    admins: admins,
    orders: orders,
    products: products,
    leads: leads,
    flags: flags,
    landings: landings,
    _meta: _meta,

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

  // db:change CustomEvent contract documented:
  //
  //   window.addEventListener('db:change', function (e) {
  //     const { collection, action, payload } = e.detail;
  //     // collection: 'users' | 'affiliates' | 'orders' | 'products' | 'leads' | 'flags' | 'landings' | '_meta'
  //     // action: 'create' | 'update' | 'delete' | 'toggle' | 'set' | 'reorder' | 'import' | 'reset'
  //     // payload: the affected record (or { id } for deletes, null for reset)
  //   });
})();
