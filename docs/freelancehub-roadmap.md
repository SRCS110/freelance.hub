# FreelanceHub — iOS App & Subscription Roadmap

---

## Overview

Three parallel tracks:

1. **Demo Board** — unauthenticated preview with fake data, no storage
2. **Subscription Layer** — Stripe billing gating data persistence
3. **iOS App** — native React Native app using the same Supabase backend

---

## Track 1 — Demo Board

### Goal
Let a new visitor explore the full dashboard with realistic fake data before signing up. No account required, nothing stored. Converts curiosity into sign-ups.

### How it works
- `/demo` route (or `?demo=true` param on the web app) loads `STATE` with hardcoded seed data instead of fetching from Supabase
- All write operations (save, delete, create) are intercepted and show a "Sign up to save" prompt instead of making DB calls
- Session is entirely in-memory — refreshing the page resets it
- A persistent banner at the top: *"You're in demo mode — your changes won't be saved. [Create a free account →]"*

### Seed data to include
- 3 clients (Acme Corp, Bright Studio, Danny Martinez)
- 4 projects across different statuses (Lead, Active, Review, Complete)
- 6 months of income/expense entries
- 2 invoices (one Paid, one Overdue)
- 3 bookmarks with masked credentials
- 2 tech stack entries
- 1 active workflow run (Getting Started, 4 steps done)
- A partially filled business plan

### Implementation steps
1. Add `?demo=true` URL detection in `app.js` boot sequence
2. Build `demo-data.js` — a file that exports a `DEMO_STATE` object matching the full `STATE.data` shape
3. Wrap `db.insert`, `db.update`, `db.delete` in a check: if demo mode, show upgrade modal instead
4. Build the upgrade modal — clean CTA with pricing, sign up button
5. Add demo banner component to `sidebarHTML` and `mobileBarHTML`
6. Add "Try the demo →" button to `login.html`

### Files to create/modify
| File | Change |
|------|--------|
| `client/js/demo-data.js` | New — seed data |
| `client/js/app.js` | Detect demo mode, skip auth, load seed state |
| `client/js/auth.js` | Intercept writes in demo mode |
| `login.html` | Add "Try demo" link |

---

## Track 2 — Subscription Layer

### Goal
Free tier gets the demo. Paid tier ($X/month) gets full data storage, multi-device sync, and all features. Stripe handles billing. Supabase enforces access.

### Pricing model suggestion
| Tier | Price | Features |
|------|-------|----------|
| Demo | Free | Read-only, fake data, no storage |
| Solo | $12/mo | Full app, 1 user, unlimited data |
| Studio | $29/mo | Up to 5 users, client portal (future) |

### Architecture
- Stripe Checkout for payment
- Supabase Edge Function as the webhook receiver (`stripe-webhook`)
- `subscriptions` table in Supabase tracks plan, status, and Stripe customer ID
- RLS policies check subscription status before allowing data writes
- Supabase stores `stripe_customer_id` on `auth.users` metadata

### Implementation steps

**Phase 1 — Stripe setup**
1. Create Stripe account, set up products (Solo, Studio)
2. Create Stripe Checkout session via a Supabase Edge Function
3. Build `/subscribe` page (or modal) — plan picker, Stripe Checkout redirect
4. Webhook Edge Function receives `checkout.session.completed`, writes to `subscriptions` table

**Phase 2 — Supabase enforcement**
1. Add `subscriptions` table:
   ```sql
   create table subscriptions (
     id                 uuid primary key default uuid_generate_v4(),
     user_id            uuid references auth.users(id) on delete cascade,
     stripe_customer_id text,
     stripe_sub_id      text,
     plan               text default 'demo',
     status             text default 'active',
     current_period_end timestamptz,
     created_at         timestamptz default now()
   );
   ```
2. Update RLS policies to check `subscriptions.status = 'active'` for write operations
3. Add subscription check in `app.js` after `loadAll` — if no active subscription, show upgrade prompt

**Phase 3 — In-app subscription management**
1. Add "Billing" section to Account & Settings
2. Show current plan, next billing date, usage summary
3. Stripe Customer Portal link for managing payment method / cancellation
4. Upgrade/downgrade flow

### Files to create/modify
| File | Change |
|------|--------|
| `supabase/functions/create-checkout/index.ts` | Edge Function — create Stripe session |
| `supabase/functions/stripe-webhook/index.ts` | Edge Function — handle Stripe events |
| `docs/schema.sql` | Add `subscriptions` table |
| `client/pages/user.js` | Add Billing section |
| `client/js/app.js` | Subscription gate after loadAll |

---

## Track 3 — iOS App

### Recommended approach: React Native (Expo)

**Why React Native over Swift:**
- Reuse 70-80% of business logic (Supabase calls, data formatting, state shape)
- Same Supabase backend — no backend changes needed
- Expo handles push notifications, file system, and App Store builds
- Faster to ship than native Swift
- Can share the Supabase auth session with the web app (same JWT)

**Why not Swift:**
- Would require rewriting all data layer from scratch
- Longer timeline (6-9 months vs 2-3 months with RN)
- Harder to keep in sync with web feature updates

### App structure (React Native / Expo)

```
freelancehub-app/
├── app/                    ← Expo Router screens
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── (tabs)/
│   │   ├── dashboard.tsx
│   │   ├── clients.tsx
│   │   ├── projects.tsx
│   │   ├── finances.tsx
│   │   ├── invoices.tsx
│   │   └── more.tsx        ← Bookmarks, Tech Stack, Workflows, Brainstorm
│   └── _layout.tsx
├── components/             ← Shared UI components
│   ├── Card.tsx
│   ├── Badge.tsx
│   ├── Modal.tsx
│   └── TodoList.tsx
├── lib/
│   ├── supabase.ts         ← Supabase client (same project, same keys)
│   ├── auth.ts
│   └── db.ts               ← Same query helpers as web
├── hooks/
│   └── useAppState.ts      ← Global state (mirrors web STATE)
└── app.json                ← Expo config
```

### Key dependencies
```json
{
  "@supabase/supabase-js": "^2",
  "expo": "~51",
  "expo-router": "^3",
  "expo-secure-store": "^13",   // replaces localStorage for tokens
  "expo-local-authentication": "^14", // Face ID for PIN
  "@stripe/stripe-react-native": "^0.37"
}
```

### iOS-specific considerations

| Feature | Web approach | iOS approach |
|---------|-------------|-------------|
| Auth tokens | localStorage | `expo-secure-store` (encrypted) |
| PIN | SHA-256 + localStorage | Face ID / Touch ID via `expo-local-authentication` |
| PDF export | jsPDF download | `expo-print` + share sheet |
| Push notifications | Not supported | `expo-notifications` + Supabase Edge Function triggers |
| Offline | Not supported | `@tanstack/react-query` with cache |
| Deep links | URL params | Expo Router universal links |

### App Store requirements
- Privacy policy URL (required)
- App privacy details (data types collected: name, email, financial data)
- Sign in with Apple (required if Google OAuth is offered)
- Minimum iOS 16 recommended

### Development phases

**Phase 1 — Foundation (weeks 1-4)**
- Expo project setup with Supabase auth
- Login / signup screens with Google OAuth + Sign in with Apple
- Tab navigation shell
- Dashboard screen with real data

**Phase 2 — Core screens (weeks 5-10)**
- Clients list + client file + document links
- Projects list + project file + todo list
- Finances with period filter
- Invoices with PDF export via share sheet

**Phase 3 — Power features (weeks 11-14)**
- Bookmarks with Face ID PIN
- Workflows + Brainstorm
- Tech Stack + Business Plan
- Account & Settings + billing

**Phase 4 — Polish & submit (weeks 15-18)**
- Offline caching
- Push notifications (invoice due, workflow reminders)
- App Store assets (screenshots, preview video)
- TestFlight beta
- App Store submission

---

## Dependency map

```
Demo Board  ──────────────────────────────► Sign Up Flow
                                                │
                                                ▼
                                        Subscription Check
                                                │
                                    ┌───────────┴───────────┐
                                    ▼                       ▼
                              Web App (current)         iOS App
                                    │                       │
                                    └──────────┬────────────┘
                                               ▼
                                      Supabase Backend
                                      (shared, unchanged)
```

---

## Recommended build order

1. **Demo board first** — lowest effort, highest marketing value. Lets you show the product to potential users and get feedback before building iOS.
2. **Stripe subscription** — set up the billing infrastructure while the web app is still the only client. Simpler to test and debug.
3. **iOS app** — once billing and the full feature set are stable, React Native port is straightforward because the data layer is already defined.

---

## Estimated timeline

| Milestone | Timeline |
|-----------|----------|
| Demo board live | 1–2 weeks |
| Stripe integration + subscription gate | 2–3 weeks |
| React Native app (Expo) v1 | 8–12 weeks |
| TestFlight beta | Week 14–16 |
| App Store launch | Week 18–20 |

