/**
 * sidebar-admin.js — Shared Alpine sidebar for the admin portal.
 *
 * Renders the dark 240px left navigation column matching the wireframe
 * (Dashboard / Users → Sellers + Affiliates / Analytics / Feature Flags /
 * Orders / Settings). Active link is highlighted from <body data-nav="...">.
 *
 * Usage:
 *   <body data-nav="dashboard">
 *     <div x-data="sidebarAdmin" x-html="template()"></div>
 *     <main>...</main>
 *   </body>
 *
 * Supported data-nav values:
 *   dashboard | sellers | affiliates | analytics | flags | orders | settings
 *
 * Auto-expands the Users group when active is sellers or affiliates.
 */
document.addEventListener('alpine:init', () => {
  Alpine.data('sidebarAdmin', () => ({
    active: '',
    usersOpen: false,

    init() {
      this.active = (document.body.dataset.nav || '').toLowerCase();
      this.usersOpen = this._isUsersChild(this.active);
    },

    _isUsersChild(key) {
      return key === 'sellers' || key === 'affiliates';
    },

    user() {
      if (window.auth && typeof window.auth.currentUser === 'function') {
        return window.auth.currentUser() || { name: 'Guest', email: '' };
      }
      return { name: 'Admin Name', email: 'admin@bsms.test' };
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
      const idle = 'text-slate-300 hover:bg-slate-800 hover:text-white';
      return base + ' ' + (this.isActive(key) ? active : idle);
    },

    subLinkClass(key) {
      const base = 'flex items-center gap-2 pl-10 pr-4 py-1.5 rounded-md text-sm transition';
      const active = 'text-orange-300 font-semibold';
      const idle = 'text-slate-400 hover:text-white';
      return base + ' ' + (this.isActive(key) ? active : idle);
    },

    template() {
      return `
        <aside class="hidden lg:flex flex-col w-60 min-h-screen bg-slate-900 text-slate-100 border-r border-slate-800">

          <!-- Brand -->
          <div class="px-5 py-5 border-b border-slate-800 flex items-center gap-2">
            <span class="text-2xl" aria-hidden="true">🍔</span>
            <span class="text-base font-semibold tracking-wide">BSMS <span class="text-orange-400">Admin</span></span>
          </div>

          <!-- Nav -->
          <nav class="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Admin navigation">

            <a href="/admin/dashboard.html" :class="linkClass('dashboard')">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l9-9 9 9M5 10v10h4v-6h6v6h4V10" /></svg>
              <span>Dashboard</span>
            </a>

            <!-- Users group -->
            <div>
              <button type="button"
                      @click="usersOpen = !usersOpen"
                      class="w-full flex items-center justify-between gap-3 px-4 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition"
                      :class="{ 'bg-slate-800 text-white': usersOpen }">
                <span class="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-3.13a4 4 0 11-8 0 4 4 0 018 0zm6 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  <span>Users</span>
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 transition"
                     :class="{ 'rotate-180': usersOpen }"
                     fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div x-show="usersOpen" x-cloak class="mt-1 space-y-0.5">
                <a href="/admin/users.html" :class="subLinkClass('sellers')">
                  <span aria-hidden="true">•</span><span>Sellers</span>
                </a>
                <a href="/admin/affiliates.html" :class="subLinkClass('affiliates')">
                  <span aria-hidden="true">•</span><span>Affiliates</span>
                </a>
              </div>
            </div>

            <a href="/admin/analytics.html" :class="linkClass('analytics')">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 3v18h18M7 15l3-3 3 3 5-5" /></svg>
              <span>Analytics</span>
            </a>

            <a href="/admin/feature-flags.html" :class="linkClass('flags')">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 21V5a2 2 0 012-2h11l-2 4 2 4H5v10z" /></svg>
              <span>Feature Flags</span>
            </a>

            <a href="/admin/orders.html" :class="linkClass('orders')">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              <span>Orders</span>
            </a>

            <a href="/admin/settings.html" :class="linkClass('settings')">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317a1 1 0 011.35 0l.387.358a1 1 0 00.94.252l.516-.137a1 1 0 011.226.79l.112.527a1 1 0 00.69.737l.503.166a1 1 0 01.683 1.183l-.137.516a1 1 0 00.252.94l.358.387a1 1 0 010 1.35l-.358.387a1 1 0 00-.252.94l.137.516a1 1 0 01-.79 1.226l-.527.112a1 1 0 00-.737.69l-.166.503a1 1 0 01-1.183.683l-.516-.137a1 1 0 00-.94.252l-.387.358a1 1 0 01-1.35 0l-.387-.358a1 1 0 00-.94-.252l-.516.137a1 1 0 01-1.226-.79l-.112-.527a1 1 0 00-.69-.737l-.503-.166a1 1 0 01-.683-1.183l.137-.516a1 1 0 00-.252-.94L4.66 13.025a1 1 0 010-1.35l.358-.387a1 1 0 00.252-.94l-.137-.516a1 1 0 01.79-1.226l.527-.112a1 1 0 00.737-.69l.166-.503a1 1 0 011.183-.683l.516.137a1 1 0 00.94-.252l.387-.358zM12 15a3 3 0 100-6 3 3 0 000 6z" /></svg>
              <span>Settings</span>
            </a>
          </nav>

          <!-- User footer -->
          <div class="p-4 border-t border-slate-800">
            <div class="flex items-center gap-3 mb-3">
              <span class="inline-flex items-center justify-center w-9 h-9 rounded-full bg-orange-600 text-white text-xs font-semibold"
                    x-text="(user().name || '?').split(' ').map(p => p[0]).slice(0,2).join('').toUpperCase()"></span>
              <div class="min-w-0">
                <p class="text-sm font-medium text-white truncate" x-text="user().name"></p>
                <p class="text-xs text-slate-400 truncate" x-text="user().email"></p>
              </div>
            </div>
            <button type="button"
                    @click="handleLogout()"
                    class="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-red-600 text-sm text-slate-200 hover:text-white transition">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" /></svg>
              <span>Logout</span>
            </button>
          </div>
        </aside>
      `;
    }
  }));
});
