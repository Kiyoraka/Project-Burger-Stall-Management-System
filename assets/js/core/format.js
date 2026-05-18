/**
 * format.js — Pure formatting helpers exposed on window.format.
 *
 * No dependencies. No state. Safe to load on every page.
 *
 * Surface:
 *   format.myr(n)        → "RM 12.50"  (Malaysian Ringgit, 2dp, RM prefix + space)
 *   format.myrShort(n)   → "RM 1.2k"   (compact for cards / KPIs above 1000)
 *   format.date(input)   → "17 May 2026"
 *   format.dateShort(in) → "17 May"
 *   format.dateTime(in)  → "17 May 2026, 14:32"
 *   format.timeAgo(in)   → "2h ago"    (relative)
 *   format.phone(s)      → "019-123 4567"  (Malaysian mobile pattern)
 *   format.phoneWA(s)    → "60191234567"   (E.164 without + for wa.me links)
 *   format.slugify(s)    → "my-burger-stall"
 *   format.initials(s)   → "AB"
 *   format.truncate(s,n) → "Hello wor…"
 *   format.statusBadge(s)→ Tailwind class string for status pills
 */
(function () {
  'use strict';

  function pad2(n) {
    return n < 10 ? '0' + n : '' + n;
  }

  function toDate(input) {
    if (input instanceof Date) return input;
    if (typeof input === 'number') return new Date(input);
    if (typeof input === 'string' && input) return new Date(input);
    return null;
  }

  const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const fmt = {

    myr: function (n) {
      const value = typeof n === 'number' ? n : parseFloat(n);
      if (!isFinite(value)) return 'RM 0.00';
      const sign = value < 0 ? '-' : '';
      const abs = Math.abs(value);
      const parts = abs.toFixed(2).split('.');
      const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      return sign + 'RM ' + intPart + '.' + parts[1];
    },

    myrShort: function (n) {
      const value = typeof n === 'number' ? n : parseFloat(n);
      if (!isFinite(value)) return 'RM 0';
      const abs = Math.abs(value);
      if (abs < 1000) return fmt.myr(value);
      if (abs < 1e6) return 'RM ' + (abs / 1000).toFixed(abs < 10000 ? 1 : 0) + 'k';
      return 'RM ' + (abs / 1e6).toFixed(abs < 1e7 ? 1 : 0) + 'M';
    },

    date: function (input) {
      const d = toDate(input);
      if (!d || isNaN(d.getTime())) return '';
      return d.getDate() + ' ' + MONTH_SHORT[d.getMonth()] + ' ' + d.getFullYear();
    },

    dateShort: function (input) {
      const d = toDate(input);
      if (!d || isNaN(d.getTime())) return '';
      return d.getDate() + ' ' + MONTH_SHORT[d.getMonth()];
    },

    dateTime: function (input) {
      const d = toDate(input);
      if (!d || isNaN(d.getTime())) return '';
      return fmt.date(d) + ', ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
    },

    timeAgo: function (input) {
      const d = toDate(input);
      if (!d || isNaN(d.getTime())) return '';
      const diff = Date.now() - d.getTime();
      const sec = Math.floor(diff / 1000);
      if (sec < 60) return 'just now';
      const min = Math.floor(sec / 60);
      if (min < 60) return min + 'm ago';
      const hr = Math.floor(min / 60);
      if (hr < 24) return hr + 'h ago';
      const day = Math.floor(hr / 24);
      if (day < 7) return day + 'd ago';
      const wk = Math.floor(day / 7);
      if (wk < 5) return wk + 'w ago';
      return fmt.dateShort(d);
    },

    phone: function (s) {
      if (!s) return '';
      const digits = String(s).replace(/\D/g, '');
      // Malaysian mobile: 01x-xxx xxxx (10 or 11 digits starting with 01)
      const local = digits.startsWith('60') ? '0' + digits.slice(2) : digits;
      if (local.length >= 10 && local.startsWith('01')) {
        return local.slice(0, 3) + '-' + local.slice(3, 6) + ' ' + local.slice(6);
      }
      return local;
    },

    phoneWA: function (s) {
      if (!s) return '';
      const digits = String(s).replace(/\D/g, '');
      // Normalize to 60xxxxxxxxx (no +)
      if (digits.startsWith('60')) return digits;
      if (digits.startsWith('0')) return '60' + digits.slice(1);
      return '60' + digits;
    },

    slugify: function (s) {
      if (!s) return '';
      return String(s)
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    },

    initials: function (s) {
      if (!s) return '?';
      return String(s)
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(function (p) { return p[0]; })
        .join('')
        .toUpperCase();
    },

    truncate: function (s, n) {
      if (!s) return '';
      const str = String(s);
      const max = typeof n === 'number' ? n : 80;
      if (str.length <= max) return str;
      return str.slice(0, Math.max(0, max - 1)).trimEnd() + '…';
    },

    statusBadge: function (status) {
      const map = {
        active: 'bg-green-100 text-green-700',
        pending: 'bg-amber-100 text-amber-700',
        suspended: 'bg-red-100 text-red-700',
        expired: 'bg-slate-200 text-slate-600',
        cancelled: 'bg-slate-200 text-slate-600',
        new: 'bg-blue-100 text-blue-700',
        contacted: 'bg-amber-100 text-amber-700',
        fulfilled: 'bg-green-100 text-green-700',
        lost: 'bg-red-100 text-red-700'
      };
      return map[String(status || '').toLowerCase()] || 'bg-slate-100 text-slate-600';
    }
  };

  window.format = fmt;
})();
