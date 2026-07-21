-- ============================================================================
-- Homework feature — table + policies + seed
-- ----------------------------------------------------------------------------
-- Run this in the Supabase SQL editor AFTER schema.sql and public-access.sql.
-- Safe to re-run (idempotent).
-- ============================================================================

create table if not exists homework (
  id          uuid primary key default gen_random_uuid(),
  child_id    uuid not null references children(id) on delete cascade,
  title       text not null,
  subject     text,
  description text,
  due_date    date,
  done        boolean not null default false,
  done_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists homework_child_due_idx on homework (child_id, due_date);

alter table homework enable row level security;

-- Login-based access (mirrors the child-scoped pattern in schema.sql).
drop policy if exists "child access" on homework;
create policy "child access" on homework for all
  using (child_id in (select id from children where family_id in (select auth_family_ids())))
  with check (child_id in (select id from children where family_id in (select auth_family_ids())));

-- No-login public access (mirrors public-access.sql).
grant select, insert, update, delete on homework to anon;
drop policy if exists "public anon access" on homework;
create policy "public anon access" on homework
  for all to anon using (true) with check (true);

-- Seed a few tasks for the public family's children (fixed ids → idempotent).
insert into homework (id, child_id, title, subject, description, due_date, done) values
  ('44444444-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222',
   'Math worksheet p.10', 'Math', 'Complete exercises 1–15 on page 10.', '2026-07-24', false),
  ('44444444-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222',
   'Science reading', 'Science', 'Read chapter 3 and write a short summary.', '2026-07-22', true),
  ('44444444-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333',
   'Reading log', 'Reading', 'Read for 20 minutes and note the story.', '2026-07-23', false)
on conflict (id) do nothing;
