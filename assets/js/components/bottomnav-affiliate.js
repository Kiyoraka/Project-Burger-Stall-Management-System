/**
 * bottomnav-affiliate.js — Fixed-bottom navigation for the mobile-only affiliate portal.
 *
 * Three tabs (Home / Users / Settings) anchored to the viewport bottom on
 * mobile. Active tab read from <body data-nav="...">. Pairs with
 * desktop-blocker.js which gates the portal at innerWidth > 900px.
 *
 * Usage:
 *   <body data-nav="home">
 *     <main class="pb-20">...page content...</main>
 *     <div x-data="bottomnavAffiliate" x-html="template()"></div>
 *   </body>
 *
 * Supported data-nav values: home | users | settings
 *
 * Note: pages should pad their main content with pb-20 (or larger) so the
 * fixed nav doesn't overlap the last row.
 */
document.addEventListener('alpine:init', () => {
  Alpine.data('bottomnavAffiliate', () => ({
    active: '',

    init() {
      this.active = (document.body.dataset.nav || '').toLowerCase();
    },

    isActive(key) {
      return this.active === key;
    },

    tabClass(key) {
      const base = 'flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition';
      const active = 'text-orange-600';
      const idle = 'text-slate-500 hover:text-slate-800';
      return base + ' ' + (this.isActive(key) ? active : idle);
    },

    iconClass(key) {
      return 'w-5 h-5 transition ' + (this.isActive(key) ? 'scale-110' : '');
    },

    template() {
      return `
        <nav class="fixed bottom-0 inset-x-0 z-20 bg-white border-t border-slate-200 shadow-[0_-4px_12px_rgba(0,0,0,0.04)]"
             aria-label="Affiliate navigation">
          <div class="max-w-md mx-auto flex">

            <a href="/affiliate/main.html" :class="tabClass('home')" aria-label="Home">
              <svg xmlns="http://www.w3.org/2000/svg" :class="iconClass('home')" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l9-9 9 9M5 10v10h4v-6h6v6h4V10" />
              </svg>
              <span class="text-[11px] font-medium">Home</span>
              <span class="block h-0.5 w-6 rounded-full mt-0.5"
                    :class="isActive('home') ? 'bg-orange-600' : 'bg-transparent'"></span>
            </a>

            <a href="/affiliate/users.html" :class="tabClass('users')" aria-label="Users">
              <svg xmlns="http://www.w3.org/2000/svg" :class="iconClass('users')" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-3.13a4 4 0 11-8 0 4 4 0 018 0zm6 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span class="text-[11px] font-medium">Users</span>
              <span class="block h-0.5 w-6 rounded-full mt-0.5"
                    :class="isActive('users') ? 'bg-orange-600' : 'bg-transparent'"></span>
            </a>

            <a href="/affiliate/settings.html" :class="tabClass('settings')" aria-label="Settings">
              <svg xmlns="http://www.w3.org/2000/svg" :class="iconClass('settings')" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317a1 1 0 011.35 0l.387.358a1 1 0 00.94.252l.516-.137a1 1 0 011.226.79l.112.527a1 1 0 00.69.737l.503.166a1 1 0 01.683 1.183l-.137.516a1 1 0 00.252.94l.358.387a1 1 0 010 1.35l-.358.387a1 1 0 00-.252.94l.137.516a1 1 0 01-.79 1.226l-.527.112a1 1 0 00-.737.69l-.166.503a1 1 0 01-1.183.683l-.516-.137a1 1 0 00-.94.252l-.387.358a1 1 0 01-1.35 0l-.387-.358a1 1 0 00-.94-.252l-.516.137a1 1 0 01-1.226-.79l-.112-.527a1 1 0 00-.69-.737l-.503-.166a1 1 0 01-.683-1.183l.137-.516a1 1 0 00-.252-.94L4.66 13.025a1 1 0 010-1.35l.358-.387a1 1 0 00.252-.94l-.137-.516a1 1 0 01.79-1.226l.527-.112a1 1 0 00.737-.69l.166-.503a1 1 0 011.183-.683l.516.137a1 1 0 00.94-.252l.387-.358zM12 15a3 3 0 100-6 3 3 0 000 6z" />
              </svg>
              <span class="text-[11px] font-medium">Settings</span>
              <span class="block h-0.5 w-6 rounded-full mt-0.5"
                    :class="isActive('settings') ? 'bg-orange-600' : 'bg-transparent'"></span>
            </a>
          </div>
        </nav>
      `;
    }
  }));
});
