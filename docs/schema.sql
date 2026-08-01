-- ============================================================
--  FreelanceHub — docs/schema.sql
--  Run this once in Supabase SQL Editor to set up all tables.
--  Dashboard → SQL Editor → paste this → Run
--  Safe to re-run: uses IF NOT EXISTS throughout.
-- ============================================================

create extension if not exists "uuid-ossp";

-- ── Clients ──────────────────────────────────────────────────
create table if not exists clients (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references auth.users(id) on delete cascade,
  name       text not null,
  email      text,
  phone      text,
  company    text,
  notes      text,
  status     text default 'Active',
  created_at timestamptz default now()
);

-- ── Projects ─────────────────────────────────────────────────
create table if not exists projects (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade,
  name        text not null,
  client_id   uuid references clients(id) on delete set null,
  client_name text,
  status      text default 'Lead',
  description text,
  deadline    date,
  budget      numeric(12,2),
  files_notes text,
  created_at  timestamptz default now()
);

-- ── Finances ─────────────────────────────────────────────────
create table if not exists finances (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade,
  type        text not null check (type in ('income','expense')),
  amount      numeric(12,2) not null,
  category    text default 'Revenue',
  description text,
  date        date default current_date,
  project_id  uuid references projects(id) on delete set null,
  client_id   uuid references clients(id) on delete set null,
  created_at  timestamptz default now()
);

-- ── Invoices ─────────────────────────────────────────────────
create table if not exists invoices (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid references auth.users(id) on delete cascade,
  invoice_number text,
  client_id      uuid references clients(id) on delete set null,
  client_name    text,
  project_id     uuid references projects(id) on delete set null,
  project_name   text,
  amount         numeric(12,2) not null default 0,
  status         text default 'Draft',
  due_date       date,
  notes          text,
  created_at     timestamptz default now()
);

-- ── Invoice Line Items ────────────────────────────────────────
create table if not exists invoice_items (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade,
  invoice_id  uuid references invoices(id) on delete cascade not null,
  description text not null,
  quantity    numeric(10,2) not null default 1,
  unit_price  numeric(12,2) not null default 0,
  amount      numeric(12,2) generated always as (quantity * unit_price) stored,
  sort_order  integer default 0,
  created_at  timestamptz default now()
);

-- ── Business Plan ─────────────────────────────────────────────
create table if not exists business_plan (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid references auth.users(id) on delete cascade unique,
  business_name   text,
  tagline         text,
  mission         text,
  vision          text,
  target_market   text,
  value_prop      text,
  revenue_model   text,
  competitors     text,
  marketing       text,
  goals_90_day    text,
  goals_1_year    text,
  goals_5_year    text,
  strengths       text,
  weaknesses      text,
  opportunities   text,
  threats         text,
  notes           text,
  updated_at      timestamptz default now(),
  created_at      timestamptz default now()
);

-- ── Row Level Security ────────────────────────────────────────
alter table clients       enable row level security;
alter table projects      enable row level security;
alter table finances      enable row level security;
alter table invoices      enable row level security;
alter table invoice_items enable row level security;
alter table business_plan enable row level security;

-- Drop old policies if re-running (safe no-op if not found)
drop policy if exists "users_clients"       on clients;
drop policy if exists "users_projects"      on projects;
drop policy if exists "users_finances"      on finances;
drop policy if exists "users_invoices"      on invoices;
drop policy if exists "users_invoice_items" on invoice_items;
drop policy if exists "users_business_plan" on business_plan;

create policy "users_clients"       on clients       for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users_projects"      on projects      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users_finances"      on finances      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users_invoices"      on invoices      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users_invoice_items" on invoice_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users_business_plan" on business_plan for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── User Settings ─────────────────────────────────────────────
create table if not exists user_settings (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references auth.users(id) on delete cascade unique,
  display_name  text,
  business_name text,
  timezone      text default 'America/New_York',
  currency      text default 'USD',
  tax_rate      numeric(5,2) default 25.00,
  date_format   text default 'MMM D, YYYY',
  fiscal_year_start integer default 1,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ── Project Credentials (replaces localStorage) ───────────────
create table if not exists project_credentials (
  id                   uuid primary key default uuid_generate_v4(),
  user_id              uuid references auth.users(id) on delete cascade,
  project_id           uuid references projects(id) on delete cascade,
  supabase_url         text,
  supabase_anon_key    text,
  google_client_id     text,
  google_client_secret text,
  google_redirect_uri  text,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now(),
  unique(user_id, project_id)
);

alter table user_settings       enable row level security;
alter table project_credentials enable row level security;

drop policy if exists "users_user_settings"       on user_settings;
drop policy if exists "users_project_credentials" on project_credentials;

create policy "users_user_settings"       on user_settings       for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users_project_credentials" on project_credentials for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
