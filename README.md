# BSMS — Burger Stall Management System

A static SaaS prototype for Malaysian burger stall sellers. Sellers subscribe → admin approves → seller configures a customer-facing landing page with WhatsApp/Call CTAs. Affiliates earn referral commissions for sign-ups.

**Software Version**: 0.1.0 (Phase 1 — Skeleton & Navigation)

## Stack

- Vanilla HTML / CSS / JS — no build step, no npm
- **Tailwind CSS** via CDN
- **Alpine.js** 3.x via CDN
- **Chart.js** via CDN (analytics pages only, lazy-loaded)
- Mock data persisted to `localStorage` (CRUD facade in `assets/js/core/db.js`)

## Run Locally

The app must be served over HTTP — `file://` breaks localStorage scope and `fetch` for `seed.json`. The stack is pure vanilla (no npm, no Python, no build), so use the **VS Code Live Server** extension.

1. Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension in VS Code.
2. Right-click `index.html` in the file explorer → **Open with Live Server**.
3. Your browser opens at <http://127.0.0.1:5500/> (default port — Live Server picks the port).

If you prefer a different editor, any zero-dependency static file server works (e.g. the IntelliJ built-in browser, Brackets, or VS Code's "Five Server" fork). The contract: serve the project root over HTTP — no Python, no Node.

## Demo Credentials

Seeded into localStorage on first visit. Reset via `/admin/settings.html → Reset Demo Data`.

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@bsms.test` | `admin123` |
| Affiliate | `affiliate1@bsms.test` | `aff123` |
| Seller | `seller1@bsms.test` | `seller123` |

Public seller landing (no login): `/site/index.html?seller=zaid-burger` (relative to whatever port Live Server picks)

## Shared CDN Head Snippet

Every HTML page in the project uses this consistent `<head>` block. Copy verbatim when stubbing new pages.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Page Title | BSMS</title>

  <!-- Tailwind CSS (CDN — no build step) -->
  <script src="https://cdn.tailwindcss.com"></script>

  <!-- Alpine.js 3.x (defer is required so x-data initializes after DOM parse) -->
  <script defer src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"></script>

  <!-- Burger favicon (inline SVG, zero requests) -->
  <link rel="icon" type="image/svg+xml"
        href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E%F0%9F%8D%94%3C/text%3E%3C/svg%3E" />

  <!-- x-cloak prevents Alpine FOUC (flash of un-styled content) -->
  <style>
    [x-cloak] { display: none !important; }
  </style>
</head>
```

### Page-Specific Additions

- **Analytics pages only** — append the Chart.js CDN before the closing `</head>`:
  ```html
  <script defer src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>
  ```
- **Admin / Seller pages (desktop)** — link the shell CSS:
  ```html
  <link rel="stylesheet" href="/assets/css/admin-shell.css" />
  <!-- or -->
  <link rel="stylesheet" href="/assets/css/seller-shell.css" />
  ```
- **Affiliate pages (mobile)** — link the mobile shell + force-include the desktop blocker:
  ```html
  <link rel="stylesheet" href="/assets/css/affiliate-mobile.css" />
  ```
- **Public site pages** — link the public site CSS:
  ```html
  <link rel="stylesheet" href="/assets/css/public-site.css" />
  ```

### Body Convention

Page-level navigation state is set via `data-nav` on `<body>` so the shared sidebar component can highlight the active link.

```html
<body data-nav="dashboard">
  <div x-data="sidebarAdmin" x-html="template()"></div>
  <main>
    <!-- page content -->
  </main>
</body>
```

## Folder Structure

```
project-root/
├── index.html              # Splash → 3 portal logins + demo seller
├── 404.html                # Platform-level not-found
├── README.md               # This file
│
├── admin/                  # Desktop, sidebar layout, 11 pages
├── affiliate/              # MOBILE-ONLY, bottom nav, 5 pages
├── seller/                 # Desktop, sidebar layout, 8 pages
├── site/                   # Public seller landing (no platform chrome)
│
└── assets/
    ├── css/                # Shell + override stylesheets
    ├── js/
    │   ├── core/           # mock-data, db, auth, format, partial-loader
    │   ├── components/     # Alpine components (sidebars, topbar, blocker, toast, modal)
    │   └── pages/          # One controller per HTML page
    ├── img/
    │   ├── brand/
    │   ├── seed-products/  # Seed burger photos
    │   ├── seed-sellers/   # Seed stall hero photos
    │   └── icons/
    └── data/
        └── seed.json       # Versioned demo data (3 admins / 5 affiliates / 12 sellers / 18 subs / 30 products / 50 leads / 6 flags / 12 landings)
```

## Locked Decisions

- Single subscription plan only (**RM 49/month**)
- Affiliate portal is **mobile-only** — desktop shows a blocker overlay at `innerWidth > 900px`
- Seller landing pages are info + CTA only — **no cart**
- Affiliate commission model: percentage of seller subscription (default **15%**)
- Auth: 3 separate login URLs per role, hardcoded credentials, no real backend
- Data: mocked + persisted to `localStorage`, mutations actually persist

## Status

Phase 1 in progress. See `Project Resources/project-plan.md` for the full roadmap (gitignored, Alice working reference).
