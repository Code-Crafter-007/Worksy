-- Worksy Phase 1 + Phase 2 schema for Supabase PostgreSQL

create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  password text not null,
  role text not null check (role in ('client', 'freelancer', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references users(id) on delete cascade,
  assigned_freelancer_id uuid references users(id) on delete set null,
  title text not null,
  description text not null,
  required_skills text[] default '{}',
  budget numeric(12,2) not null,
  deadline date not null,
  status text not null default 'open' check (status in ('open', 'in_progress', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists bids (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  freelancer_id uuid not null references users(id) on delete cascade,
  bid_amount numeric(12,2) not null,
  timeline text not null,
  proposal text not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now()
);

create unique index if not exists bids_project_freelancer_unique
on bids(project_id, freelancer_id);
