-- ============================================================================
-- ALL FEATURES — one-shot migration (Homework + Blog + About)
-- ----------------------------------------------------------------------------
-- Run this ONCE in the Supabase SQL editor AFTER schema.sql and public-access.sql.
-- It creates every remaining feature table + policies + seed data, and adds the
-- blog banner-photo column. Safe to re-run (idempotent).
--
-- (This is just homework.sql + blog.sql + about.sql combined for convenience.)
-- ============================================================================

-- ------------------------------------------------------------------ HOMEWORK
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

drop policy if exists "child access" on homework;
create policy "child access" on homework for all
  using (child_id in (select id from children where family_id in (select auth_family_ids())))
  with check (child_id in (select id from children where family_id in (select auth_family_ids())));

grant select, insert, update, delete on homework to anon;
drop policy if exists "public anon access" on homework;
create policy "public anon access" on homework
  for all to anon using (true) with check (true);

insert into homework (id, child_id, title, subject, description, due_date, done) values
  ('44444444-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222',
   'Math worksheet p.10', 'Math', 'Complete exercises 1–15 on page 10.', '2026-07-24', false),
  ('44444444-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222',
   'Science reading', 'Science', 'Read chapter 3 and write a short summary.', '2026-07-22', true),
  ('44444444-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333',
   'Reading log', 'Reading', 'Read for 20 minutes and note the story.', '2026-07-23', false)
on conflict (id) do nothing;

-- ------------------------------------------------------------------ BLOG
create table if not exists blog_posts (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null references families(id) on delete cascade,
  title      text not null,
  excerpt    text,
  date_label text,
  read_mins  int not null default 5,
  emoji      text,
  color      text,
  tag        text,
  created_at timestamptz not null default now()
);
create index if not exists blog_posts_family_idx on blog_posts (family_id, created_at);

-- Optional banner photo column (no-op if it already exists).
alter table blog_posts add column if not exists image_url text;

alter table blog_posts enable row level security;

drop policy if exists "family access" on blog_posts;
create policy "family access" on blog_posts for all
  using (family_id in (select auth_family_ids()))
  with check (family_id in (select auth_family_ids()));

grant select, insert, update, delete on blog_posts to anon;
drop policy if exists "public anon access" on blog_posts;
create policy "public anon access" on blog_posts
  for all to anon using (true) with check (true);

insert into blog_posts (id, family_id, title, excerpt, date_label, read_mins, emoji, color, tag) values
  ('55555555-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
   'The Gentle Power of Predictable Days: Building Routines',
   'A steady daily rhythm gives children a sense of safety and helps learning stick. Here is how to build routines that feel calm, not rigid.',
   'Mar 4', 7, '🌅', '#f59e0b', 'Routines'),
  ('55555555-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111',
   'Understanding Your Child''s Misbehavior: The Hidden Needs',
   'Behavior is communication. When we look past the surface, most “misbehavior” is really an unmet need asking to be seen.',
   'Feb 12', 9, '💛', '#0891b2', 'Emotions'),
  ('55555555-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111',
   'How Digital Parenting Education Transforms Families',
   'Tracking growth, celebrating wins, and reflecting together — small digital habits can bring a family closer around learning.',
   'Jan 23', 4, '📈', '#22c55e', 'Growth'),
  ('55555555-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111',
   'Turning Homework Battles into Calm Focus Time',
   'A few simple shifts — clear expectations, short breaks, and encouragement — can turn homework struggles into steady progress.',
   'Jan 8', 6, '📝', '#6366f1', 'Homework'),
  ('55555555-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111',
   'Praise the Effort, Not Just the Score',
   'Growth mindset starts at home. Learn how the words we choose shape a child’s confidence and love of learning.',
   'Dec 15', 5, '🌱', '#e11d48', 'Mindset'),
  ('55555555-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111',
   'Reading Together: The Habit That Lifts Every Subject',
   'Twenty minutes of shared reading a day builds vocabulary, focus, and connection. Here are ideas to make it a favourite ritual.',
   'Dec 1', 8, '📚', '#8b5cf6', 'Reading')
on conflict (id) do nothing;

-- ------------------------------------------------------------------ ABOUT
create table if not exists about_content (
  family_id  uuid primary key references families(id) on delete cascade,
  content    jsonb not null,
  updated_at timestamptz not null default now()
);

alter table about_content enable row level security;

drop policy if exists "family access" on about_content;
create policy "family access" on about_content for all
  using (family_id in (select auth_family_ids()))
  with check (family_id in (select auth_family_ids()));

grant select, insert, update, delete on about_content to anon;
drop policy if exists "public anon access" on about_content;
create policy "public anon access" on about_content
  for all to anon using (true) with check (true);
