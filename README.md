# Freelancer

Your all-in-one freelance business command center.

## What it does

Freelancer is a web-based business OS for freelancers and small studios. It replaces the scattered mess of spreadsheets, notes apps, and invoicing tools with a single dark-mode dashboard that covers every part of running a client-based business.

## Features

| Section | What it does |
|---------|-------------|
| **Dashboard** | KPI cards (revenue, expenses, outstanding, active projects) with period filter. Overdue invoice alerts. Quick actions. |
| **Clients** | Client card grid with full client file — contact info, linked projects, invoices, and document storage (contracts, NDAs, content forms, service agreements). |
| **Projects** | Project cards with status filter. Per-project file with description, budget, deadline, connection credentials, and an iPhone-style to-do list with priorities and due dates. |
| **Finances** | Income/expense log with period filter, project/client linking, tax estimate, and per-project income breakdown. |
| **Invoices** | Line-item invoices with PDF export (via jsPDF — no popup). Draft → Sent → Paid / Void flow. |
| **Business Plan** | Mission, vision, market, revenue model, SWOT, goals (90-day / 1-year / 5-year). Plain-text export. |
| **Bookmarks** | Website and tool manager with PIN-protected credential storage (email, username, password). Monthly cost tracking. |
| **Tech Stack** | Recurring subscription tracker — monthly burn, annual total, grouped by category. |
| **Workflows** | Reusable SOP templates with ordered steps. Start a live "run" linked to a client or project and tick off steps with notes. |
| **Brainstorm** | Guided thinking sessions (New Service Idea, Client Pitch, Quarterly Goals, Problem Solving) or free-form notes with tags. |
| **Account & Settings** | Display name, business name, currency, tax rate, timezone. Credential PIN setup. Password reset. Billing section (coming soon). |

## Demo mode

Visit `freelance.srcs.online/index.html?demo=true` to explore the full product with sample data for a fictional design studio (Meridian Creative). Nothing is saved — all writes are intercepted and show a subscription prompt.

## File structure

```
/
├── index.html                  ← App shell. Open this in browser.
├── login.html                  ← Auth screen (email/password + Google OAuth)
├── client/
│   ├── css/
│   │   └── styles.css          ← Full design system. Dark + light theme via CSS vars.
│   ├── js/
│   │   ├── auth.js             ← Supabase SDK client, db helpers, session, OAuth
│   │   ├── app.js              ← App state, render router, boot sequence
│   │   ├── utils.js            ← Shared helpers: formatters, modal, badges
│   │   ├── pin.js              ← In-app PIN system (SHA-256, 15-min session)
│   │   ├── onboarding.js       ← Auto-installs Getting Started workflow on first login
│   │   ├── demo-data.js        ← Seed data for demo mode
│   │   └── demo.js             ← Demo mode controller + upgrade modal
│   └── pages/
│       ├── dashboard.js
│       ├── clients.js
│       ├── projects.js
│       ├── finances.js
│       ├── invoices.js
│       ├── business-plan.js
│       ├── bookmarks.js
│       ├── tech-stack.js
│       ├── workflows.js
│       ├── brainstorm.js
│       └── user.js
└── docs/
    └── schema.sql              ← Run once in Supabase SQL Editor to create all tables.
```

## Setup

### 1. Supabase tables

Go to **Supabase → SQL Editor**, paste `docs/schema.sql`, and run it. Safe to re-run (uses `IF NOT EXISTS` throughout).

### 2. Add your credentials

Open `client/js/auth.js` and fill in the two constants at the top:

```js
const SUPABASE_URL  = 'https://your-project.supabase.co';
const SUPABASE_ANON = 'eyJhbGci...';
```

Find these at **Supabase → Settings → API**. The anon key is public-safe — RLS policies protect your data. Never put the `service_role` key here.

### 3. Open the app

Open `index.html` in a browser or push to GitHub Pages.

## Authentication

- Email/password sign-in and sign-up
- Google OAuth (configure credentials in **Supabase → Authentication → Providers → Google**)
- JWT tokens auto-refresh — session stays active without re-login
- On first login, a "Getting Started" workflow is automatically installed

## Security

- **Row Level Security** — every table has RLS enabled. Users can only read/write their own data.
- **Credential PIN** — bookmark passwords and project credentials require a 4–8 digit PIN. Hashed with SHA-256 before storage. Session active for 15 minutes per verification.
- **Anon key** — safe to commit. It cannot bypass RLS. Never commit the `service_role` key.
- **Google OAuth secrets** — live only in Supabase's dashboard, never in code.

## Theme

Supports dark mode (default) and light mode. Toggle in the sidebar footer. Preference saved to `localStorage`.

Design system: JetBrains Mono + Inter, brutalist terminal aesthetic, neon mint accent (`#3bf4a3`), CSS custom properties throughout.

## Roadmap

- [ ] Stripe subscription ($12/mo) — gates data storage behind payment
- [ ] iOS app (React Native / Expo) — same Supabase backend
- [ ] Client portal — share project status and invoices with clients
- [ ] Push notifications — overdue invoice and workflow step reminders
- [ ] Onboarding email sequences — automated emails to new clients

## What to edit

| File | Edit when you want to… |
|------|----------------------|
| `client/js/auth.js` | Change Supabase credentials or OAuth behavior |
| `client/css/styles.css` | Change any visual styling or theme colors |
| `client/js/app.js` | Add a new page to the nav or change boot behavior |
| `client/js/demo-data.js` | Update the demo mode sample data |
| `client/js/onboarding.js` | Change the Getting Started workflow steps |
| `docs/schema.sql` | Add new database tables |
| `login.html` | Change the login/signup screen |
