/**
 * sidebar-seller.js — Shared Alpine sidebar for the seller portal.
 *
 * Brand-colored 240px left navigation matching the wireframe (Dashboard /
 * Analytics / Products / Orders / Settings) with a subscription status block
 * pulled from db.orders for the current seller. Active link highlighted from
 * <body data-nav="...">.
 *
 * Usage:
 *   <body data-nav="dashboard">
 *     <div x-data="sidebarSeller" x-html="template()"></div>
 *     <main>...</main>
 *   </body>
 *
 * Supported data-nav values:
 *   dashboard | analytics | products | orders | settings
 */
document.addEventListener('alpine:init', () => {
  Alpine.data('sidebarSeller', () => ({
    active: '',
    subscription: null,

    init() {
      this.active = (document.body.dataset.nav || '').toLowerCase();
      this.subscription = this._loadSubscription();
      window.addEventListener('db:change', () => {
        this.subscription = this._loadSubscription();
      });
    },

    _loadSubscription() {
      const u = this.user();
      if (!u || !u.id || !window.db || !window.db.orders) {
        return { status: 'active', endDate: '12 Jun 2026' };
      }
      try {
        const all = window.db.orders.list({ sellerId: u.id }) || [];
        const active = all.find((o) => o.status === 'active');
        if (active) {
          return { status: 'active', endDate: this._fmtDate(active.endDate) };
        }
        const latest = all[0];
        return latest
          ? { status: latest.status, endDate: this._fmtDate(latest.endDate) }
          : { status: 'none', endDate: null };
      } catch (e) {
        return { status: 'active', endDate: '12 Jun 2026' };
      }
    },

    _fmtDate(iso) {
      if (!iso) return null;
      if (window.format && typeof window.format.date === 'function') {
        return window.format.date(iso);
      }
      try {
        const d = new Date(iso);
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      } catch (e) {
        return iso;
      }
    },

    user() {
      if (window.auth && typeof window.auth.currentUser === 'function') {
        return window.auth.currentUser() || { name: 'Seller', email: '', stallName: '' };
      }
      return { name: 'Zaid Hassan', email: 'zaid@bsms.test', stallName: 'Zaid Burger' };
    },

    handleLogout() {
      if (window.auth && typeof window.auth.logout === 'function') {
        window.auth.logout();
      } else {
        try { localStorage.removeItem('bsms.session'); } catch (e) {}
      }
      window.location.href = '/index.html';
    },

    isActive(key) {
      return this.active === key;
    },

    linkClass(key) {
      const base = 'flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition';
      const active = 'bg-orange-600 text-white shadow-sm';
      const idle = 'text-slate-700 hover:bg-orange-50 hover:text-orange-700';
      return base + ' ' + (this.isActive(key) ? active : idle);
    },

    subStatusBadge() {
      const s = (this.subscription && this.subscription.status) || 'unknown';
      const map = {
        active: 'bg-green-100 text-green-700',
        pending: 'bg-amber-100 text-amber-700',
        expired: 'bg-red-100 text-red-700',
        cancelled: 'bg-slate-100 text-slate-600',
        none: 'bg-slate-100 text-slate-600',
        unknown: 'bg-slate-100 text-slate-600'
      };
      return map[s] || map.unknown;
    },

    template() {
      return `
        <aside class="hidden lg:flex flex-col w-60 min-h-screen bg-white text-slate-800 border-r border-slate-200">

          <!-- Brand -->
          <div class="px-5 py-5 border-b border-slate-200 flex items-center gap-2">
            <span class="text-2xl" aria-hidden="true">🍔</span>
            <div class="flex flex-col">
              <span class="text-base font-semibold text-slate-800">My Stall</span>
              <span class="text-xs text-slate-500 truncate" x-text="user().stallName || 'BSMS Seller'"></span>
            </div>
          </div>

          <!-- Nav -->
          <nav class="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Seller navigation">

            <a href="/seller/dashboard.html" :class="linkClass('dashboard')">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l9-9 9 9M5 10v10h4v-6h6v6h4V10" /></svg>
              <span>Dashboard</span>
            </a>

            <a href="/seller/analytics.html" :class="linkClass('analytics')">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 3v18h18M7 15l3-3 3 3 5-5" /></svg>
              <span>Analytics</span>
            </a>

            <a href="/seller/products.html" :class="linkClass('products')">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
              <span>Products</span>
            </a>

            <a href="/seller/orders.html" :class="linkClass('orders')">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              <span>Orders</span>
            </a>

            <a href="/seller/settings.html" :class="linkClass('settings')">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317a1 1 0 011.35 0l.387.358a1 1 0 00.94.252l.516-.137a1 1 0 011.226.79l.112.527a1 1 0 00.69.737l.503.166a1 1 0 01.683 1.183l-.137.516a1 1 0 00.252.94l.358.387a1 1 0 010 1.35l-.358.387a1 1 0 00-.252.94l.137.516a1 1 0 01-.79 1.226l-.527.112a1 1 0 00-.737.69l-.166.503a1 1 0 01-1.183.683l-.516-.137a1 1 0 00-.94.252l-.387.358a1 1 0 01-1.35 0l-.387-.358a1 1 0 00-.94-.252l-.516.137a1 1 0 01-1.226-.79l-.112-.527a1 1 0 00-.69-.737l-.503-.166a1 1 0 01-.683-1.183l.137-.516a1 1 0 00-.252-.94L4.66 13.025a1 1 0 010-1.35l.358-.387a1 1 0 00.252-.94l-.137-.516a1 1 0 01.79-1.226l.527-.112a1 1 0 00.737-.69l.166-.503a1 1 0 011.183-.683l.516.137a1 1 0 00.94-.252l.387-.358zM12 15a3 3 0 100-6 3 3 0 000 6z" /></svg>
              <span>Settings</span>
            </a>
          </nav>

          <!-- Subscription status -->
          <div class="px-4 py-3 border-t border-slate-200 bg-slate-50">
            <div class="flex items-center justify-between gap-2 mb-1">
              <span class="text-xs uppercase tracking-wide text-slate-500">Subscription</span>
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase"
                    :class="subStatusBadge()"
                    x-text="(subscription && subscription.status) || 'unknown'"></span>
            </div>
            <p class="text-xs text-slate-600" x-show="subscription && subscription.endDate">
              Until <span class="font-medium text-slate-800" x-text="subscription && subscription.endDate"></span>
            </p>
          </div>

          <!-- User footer -->
          <div class="p-4 border-t border-slate-200">
            <div class="flex items-center gap-3 mb-3">
              <span class="inline-flex items-center justify-center w-9 h-9 rounded-full bg-orange-600 text-white text-xs font-semibold"
                    x-text="(user().name || '?').split(' ').map(p => p[0]).slice(0,2).join('').toUpperCase()"></span>
              <div class="min-w-0">
                <p class="text-sm font-medium text-slate-800 truncate" x-text="user().name"></p>
                <p class="text-xs text-slate-500 truncate" x-text="user().email"></p>
              </div>
            </div>
            <button type="button"
                    @click="handleLogout()"
                    class="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-100 hover:bg-red-600 text-sm text-slate-700 hover:text-white transition">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" /></svg>
              <span>Logout</span>
            </button>
          </div>
        </aside>
      `;
    }
  }));
});
