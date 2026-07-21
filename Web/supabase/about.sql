-- ============================================================================
-- About page content — one editable row per family
-- ----------------------------------------------------------------------------
-- Run in the Supabase SQL editor AFTER schema.sql and public-access.sql.
-- Stores the editable About prose as a JSON document. Safe to re-run.
-- ============================================================================

create table if not exists about_content (
  family_id  uuid primary key references families(id) on delete cascade,
  content    jsonb not null,
  updated_at timestamptz not null default now()
);

alter table about_content enable row level security;

-- Login-based access (family-scoped).
drop policy if exists "family access" on about_content;
create policy "family access" on about_content for all
  using (family_id in (select auth_family_ids()))
  with check (family_id in (select auth_family_ids()));

-- No-login public access (mirrors public-access.sql).
grant select, insert, update, delete on about_content to anon;
drop policy if exists "public anon access" on about_content;
create policy "public anon access" on about_content
  for all to anon using (true) with check (true);
