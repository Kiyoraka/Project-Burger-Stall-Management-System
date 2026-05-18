/**
 * topbar.js — Shared Alpine component for admin and seller portals.
 *
 * Renders the right side of the page header: notification bell + user dropdown
 * (matching the [Bell] [User] cluster in every desktop-portal wireframe).
 *
 * Usage:
 *   <div x-data="topbar" x-html="template()"></div>
 *
 * Expects window.auth (assets/js/core/auth.js) to expose currentUser() returning
 * { name, email, role } and a logout() method. Until auth.js exists, falls back
 * to a placeholder display so stub pages still render.
 */
document.addEventListener('alpine:init', () => {
  Alpine.data('topbar', () => ({
    open: false,
    notifOpen: false,
    notifCount: 0,

    init() {
      this.notifCount = this._loadNotifCount();
      window.addEventListener('db:change', () => {
        this.notifCount = this._loadNotifCount();
      });
    },

    _loadNotifCount() {
      try {
        const raw = localStorage.getItem('bsms.notifications.unread');
        return raw ? parseInt(raw, 10) || 0 : 0;
      } catch (e) {
        return 0;
      }
    },

    user() {
      if (window.auth && typeof window.auth.currentUser === 'function') {
        return window.auth.currentUser() || { name: 'Guest', email: '', role: 'guest' };
      }
      return { name: 'Demo User', email: 'demo@bsms.test', role: 'admin' };
    },

    initials() {
      const name = this.user().name || '?';
      return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join('');
    },

    handleLogout() {
      if (window.auth && typeof window.auth.logout === 'function') {
        window.auth.logout();
      } else {
        try { localStorage.removeItem('bsms.session'); } catch (e) {}
      }
      window.location.href = '/index.html';
    },

    closeAll() {
      this.open = false;
      this.notifOpen = false;
    },

    template() {
      return `
        <div class="relative flex items-center gap-2" @click.outside="closeAll()">

          <!-- Notification bell -->
          <button type="button"
                  @click="notifOpen = !notifOpen; open = false"
                  class="relative inline-flex items-center justify-center w-10 h-10 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                  aria-label="Notifications">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0a3 3 0 11-6 0" />
            </svg>
            <span x-show="notifCount > 0"
                  x-text="notifCount > 9 ? '9+' : notifCount"
                  class="absolute -top-0.5 -right-0.5 min-w-[1.1rem] h-[1.1rem] px-1 inline-flex items-center justify-center text-[10px] font-semibold text-white bg-red-500 rounded-full"></span>
          </button>

          <!-- Notification dropdown -->
          <div x-show="notifOpen" x-cloak x-transition
               class="absolute right-12 top-12 w-72 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-30">
            <div class="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <span class="text-sm font-semibold text-slate-700">Notifications</span>
              <span class="text-xs text-slate-400" x-text="notifCount + ' unread'"></span>
            </div>
            <div class="p-4 text-sm text-slate-500" x-show="notifCount === 0">
              You're all caught up.
            </div>
            <div class="p-2 text-xs text-slate-400 border-t border-slate-100">
              Live feed wires up in Phase 6.
            </div>
          </div>

          <!-- User dropdown trigger -->
          <button type="button"
                  @click="open = !open; notifOpen = false"
                  class="inline-flex items-center gap-2 pl-1 pr-3 py-1 rounded-full hover:bg-slate-100 transition"
                  aria-haspopup="menu"
                  :aria-expanded="open">
            <span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-600 text-white text-xs font-semibold"
                  x-text="initials()"></span>
            <span class="hidden sm:inline text-sm font-medium text-slate-700" x-text="user().name"></span>
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <!-- User menu -->
          <div x-show="open" x-cloak x-transition
               class="absolute right-0 top-12 w-56 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-30"
               role="menu">
            <div class="px-4 py-3 border-b border-slate-100">
              <p class="text-sm font-semibold text-slate-800" x-text="user().name"></p>
              <p class="text-xs text-slate-500 truncate" x-text="user().email"></p>
              <p class="mt-1 inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-medium text-slate-600 uppercase tracking-wide"
                 x-text="user().role"></p>
            </div>
            <ul class="py-1 text-sm">
              <li>
                <a href="settings.html"
                   class="block px-4 py-2 text-slate-700 hover:bg-slate-50">Settings</a>
              </li>
              <li>
                <button type="button"
                        @click="handleLogout()"
                        class="w-full text-left block px-4 py-2 text-red-600 hover:bg-red-50">Logout</button>
              </li>
            </ul>
          </div>
        </div>
      `;
    }
  }));
});
