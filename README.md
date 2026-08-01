# FreelanceHub

Your all-in-one freelance business dashboard.

## Folder Structure

```
freelance-hub/
├── index.html              ← Open this in your browser. Never edit for credentials.
├── login.html              ← Auth screen (email/password + Google OAuth when enabled).
├── config/
│   └── config.js           ← YOUR CREDENTIALS LIVE HERE. Edit once, never again.
├── client/
│   ├── css/
│   │   └── styles.css      ← All styles for the entire app.
│   ├── js/
│   │   ├── supabase.js     ← Supabase API client (db calls, auto token refresh)
│   │   ├── auth.js         ← Sign up, sign in, sign out, session restore + refresh
│   │   ├── utils.js        ← Shared helpers: formatters, modal, swirl animation
│   │   └── app.js          ← App state, render router, boot sequence
│   └── pages/
│       ├── dashboard.js    ← Dashboard (period filter, overdue alert, quick actions)
│       ├── clients.js      ← Client CRM
│       ├── projects.js     ← Projects list + Project File + Connection Panel
│       ├── finances.js     ← Finances + period filter + project/client linking
│       ├── invoices.js     ← Invoices with line items + PDF/print export
│       └── business-plan.js ← Business plan (mission, SWOT, goals, export)
└── docs/
    └── schema.sql          ← Run once in Supabase SQL Editor to create all tables.
```

## Setup (one time)

1. **Create Supabase tables** — go to your Supabase project → SQL Editor → paste and run `docs/schema.sql`
2. **Set credentials** — open `config/config.js` and paste your Supabase URL and anon key
3. **Open the app** — open `index.html` in your browser

> ⚠️ If you were already running a previous version of FreelanceHub, re-run the schema.sql to
> add the new `invoice_items` and `business_plan` tables, and the `project_id`/`client_id` columns
> on `finances`. The script is idempotent (safe to re-run).

## What's in each page

| Page | What it does |
|------|-------------|
| Dashboard | KPI cards with period filter (month/quarter/year/all-time), overdue invoice alert, quick actions |
| Clients | Full client CRM — name, company, email, phone, notes, status |
| Projects | Project cards with status filter; per-project file with Connection Credentials panel |
| Finances | Income/expense log with period filter, project/client linking, tax estimate, per-project breakdown |
| Invoices | Line-item invoices with print/PDF export; Draft → Sent → Paid / Void flow |
| Business Plan | Mission, vision, market, revenue model, goals, SWOT, plaintext export |

## Session handling

Auth tokens are automatically refreshed before they expire (Supabase JWTs default to 1 hour).
If a refresh fails (e.g. you were offline), you'll be redirected to the login page.

## File responsibilities

| File | What to edit it for |
|------|---------------------|
| `config/config.js` | Changing Supabase or OAuth credentials |
| `client/css/styles.css` | Any visual/design changes |
| `client/js/supabase.js` | Changing how db calls work |
| `client/js/auth.js` | Changing login logic, token behavior, or adding OAuth providers |
| `client/pages/dashboard.js` | Dashboard layout changes |
| `client/pages/projects.js` | Project page or connection panel changes |
| `client/pages/finances.js` | Finance tracking changes |
| `client/pages/invoices.js` | Invoice or line-item changes |
| `client/pages/business-plan.js` | Business plan sections or export format |
| `docs/schema.sql` | Adding new tables to Supabase |

## Notes on localStorage

Project-level credentials (Supabase URL, anon key, OAuth secrets entered via the Connection
Panel) are stored in `localStorage` on this device only. Do not use shared/public computers
to store production secrets here.
