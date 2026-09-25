-- HOPE2 Academy — Supabase schema for the current API server.
--
-- The running API uses two tables:
--   public.users  — structured portal accounts
--   public.items  — all other records, stored as JSONB by collection
--
-- Reports, modules, notifications, audit entries, and the portal's operational
-- collections are rows in public.items; they are not separate SQL tables in the
-- current application.
--
-- Apply with `supabase db push`, or run this file in the Supabase SQL Editor.
-- This migration creates structure only; it does not import application records
-- or demo accounts. The API must connect server-side with a database owner or
-- service_role connection; do not connect from the browser.
--
-- SECURITY NOTE: The current API compares the `users.password` value directly.
-- This column is retained only for compatibility with that API. Do not use real
-- production passwords until the application migrates to password hashing or
-- Supabase Auth.

create table if not exists public.users (
  id text primary key,
  username text unique,
  email text not null unique,
  password text not null,
  name text not null,
  role text not null check (role in (
    'superadmin',
    'admin',
    'admin_assistant',
    'registrar',
    'admissions_officer',
    'teacher',
    'nurse',
    'student',
    'parent',
    'alumni'
  )),
  avatar text,
  phone text,
  address text,
  bio text,
  date_of_birth text,
  emergency_contact text,
  grade text,
  class_name text,
  department text,
  subjects text[],
  graduation_year text,
  linked_children text[],
  created_at timestamp without time zone not null default now()
);

create unique index if not exists users_username_casefold_uq
  on public.users (lower(username))
  where username is not null and length(btrim(username)) > 0;

create unique index if not exists users_email_casefold_uq
  on public.users (lower(email));

create table if not exists public.items (
  collection text not null,
  id text not null,
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  updated_at timestamp without time zone not null default now(),
  constraint items_collection_id_pk primary key (collection, id)
);

create index if not exists items_collection_updated_at_idx
  on public.items (collection, updated_at desc);

create index if not exists items_data_gin_idx
  on public.items using gin (data jsonb_path_ops);

comment on table public.users is
  'HOPE2 portal accounts. Username/password authentication is handled by the API server.';
comment on column public.users.username is
  'Portal login name, normally generated as firstname@hope2academy.';
comment on column public.users.email is
  'Account email, reserved for password recovery and contact purposes.';
comment on column public.users.password is
  'Legacy API compatibility only. Current API stores this value unhashed; migrate authentication before using real passwords.';
comment on table public.items is
  'Generic JSONB record store. Each row is keyed by application collection and record id.';

-- The browser must not read or modify account/password or application records
-- directly. The API server uses a privileged server-side PostgreSQL connection.
alter table public.users enable row level security;
alter table public.items enable row level security;

revoke all privileges on table public.users, public.items from public, anon, authenticated;
grant usage on schema public to service_role;
grant all privileges on table public.users, public.items to service_role;