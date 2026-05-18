/**
 * desktop-blocker.js — Mobile-only gate for the affiliate portal.
 *
 * Renders a full-screen overlay whenever window.innerWidth exceeds the
 * MOBILE_MAX threshold (900px per plan locked decisions). The "Try anyway"
 * button writes a sessionStorage dismissal flag so the user can preview on
 * desktop within the same tab.
 *
 * Usage (add to every /affiliate/*.html page right after <body>):
 *   <div x-data="desktopBlocker" x-html="template()"></div>
 *
 * The component listens to window resize events and re-evaluates visibility
 * live. Dismissal is per-session (clears when tab/browser closes).
 */
document.addEventListener('alpine:init', () => {
  const MOBILE_MAX = 900;
  const DISMISS_KEY = 'bsms.affiliate.desktopDismissed';

  Alpine.data('desktopBlocker', () => ({
    tooWide: false,
    dismissed: false,

    init() {
      this.dismissed = this._loadDismissed();
      this._recompute();
      this._onResize = this._recompute.bind(this);
      window.addEventListener('resize', this._onResize);
    },

    destroy() {
      window.removeEventListener('resize', this._onResize);
    },

    _loadDismissed() {
      try {
        return sessionStorage.getItem(DISMISS_KEY) === '1';
      } catch (e) {
        return false;
      }
    },

    _recompute() {
      this.tooWide = window.innerWidth > MOBILE_MAX;
    },

    visible() {
      return this.tooWide && !this.dismissed;
    },

    tryAnyway() {
      this.dismissed = true;
      try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch (e) {}
    },

    template() {
      return `
        <div x-show="visible()" x-cloak
             class="fixed inset-0 z-50 bg-white flex items-center justify-center px-6"
             role="dialog"
             aria-modal="true"
             aria-labelledby="desktop-blocker-title">
          <div class="max-w-md w-full text-center">

            <div class="mx-auto mb-6 w-20 h-32 rounded-3xl border-4 border-slate-800 flex flex-col items-center justify-center bg-slate-50 shadow-inner relative">
              <div class="absolute -top-1.5 w-8 h-1.5 rounded-b-lg bg-slate-800"></div>
              <span class="text-3xl">📱</span>
              <div class="absolute -bottom-2 w-8 h-2 rounded-full bg-slate-800/10"></div>
            </div>

            <h1 id="desktop-blocker-title" class="text-2xl md:text-3xl font-bold text-slate-800">
              This portal is mobile-only
            </h1>
            <p class="mt-3 text-sm md:text-base text-slate-600">
              Open on your phone, or resize your browser to under
              <span class="font-semibold text-slate-800">${MOBILE_MAX}px</span> wide.
            </p>

            <p class="mt-2 text-xs text-slate-400">
              Current width: <span x-text="window.innerWidth + 'px'"></span>
            </p>

            <button type="button"
                    @click="tryAnyway()"
                    class="mt-8 inline-flex items-center gap-2 rounded-full bg-slate-100 px-6 py-3 text-sm font-medium text-slate-700 hover:bg-slate-200 transition">
              Try anyway →
            </button>

            <p class="mt-6 text-xs text-slate-400">
              <a href="/index.html" class="hover:text-slate-600 underline">Back to home</a>
            </p>
          </div>
        </div>
      `;
    }
  }));
});
