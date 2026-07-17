-- ============================================================================
-- Growth tracker — Supabase / PostgreSQL schema
-- Mirrors Data_Model.md. Paste into the Supabase SQL editor (or `supabase db`
-- migrations) to create the backend. Safe to re-run: drops nothing, guards with
-- IF NOT EXISTS where possible. Enums are created only if missing.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type member_role as enum ('owner', 'parent', 'guardian', 'viewer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type semester_enum as enum ('first', 'second');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table if not exists users (
  id           uuid primary key default gen_random_uuid(),
  email        text unique not null,
  display_name text,
  avatar_url   text,
  created_at   timestamptz not null default now()
);

create table if not exists families (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  owner_user_id uuid not null references users(id),
  created_at    timestamptz not null default now()
);

create table if not exists family_members (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null references families(id) on delete cascade,
  user_id    uuid not null references users(id) on delete cascade,
  role       member_role not null default 'parent',
  created_at timestamptz not null default now(),
  unique (family_id, user_id)
);

create table if not exists children (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null references families(id) on delete cascade,
  name       text not null,
  grade      text,
  avatar     text,
  color      text,
  birth_year int,
  photo_url  text,
  created_at timestamptz not null default now()
);

-- Add photo_url to pre-existing children tables (no-op if already present).
alter table children add column if not exists photo_url text;

create table if not exists rewards (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null references families(id) on delete cascade,
  name       text not null,
  icon       text,
  cost       int not null default 0,
  category   text,
  claimed    boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists scores (
  id          uuid primary key default gen_random_uuid(),
  child_id    uuid not null references children(id) on delete cascade,
  subject     text not null,
  score       numeric(4,2) not null,
  max_score   numeric(4,2) not null default 10,
  score_date  date not null,
  semester    semester_enum,
  grade_level int,
  term        text,
  notes       text,
  created_at  timestamptz not null default now()
);
create index if not exists scores_child_subject_date_idx
  on scores (child_id, subject, score_date);

create table if not exists academic_goals (
  id           uuid primary key default gen_random_uuid(),
  child_id     uuid not null references children(id) on delete cascade,
  title        text,
  subject      text,
  target_score numeric(4,2),
  reward_id    uuid references rewards(id) on delete set null,
  points       int not null default 0,
  done         boolean not null default false,
  done_at      timestamptz,
  created_at   timestamptz not null default now()
);

create table if not exists habits (
  id                  uuid primary key default gen_random_uuid(),
  child_id            uuid not null references children(id) on delete cascade,
  name                text not null,
  icon                text,
  unit                text,
  target_weekly_value numeric not null,
  created_at          timestamptz not null default now()
);

create table if not exists habit_checkins (
  id           uuid primary key default gen_random_uuid(),
  habit_id     uuid not null references habits(id) on delete cascade,
  value        numeric not null,
  checkin_date date not null,
  created_at   timestamptz not null default now()
);
create index if not exists habit_checkins_habit_date_idx
  on habit_checkins (habit_id, checkin_date);

create table if not exists weekly_snapshots (
  id             uuid primary key default gen_random_uuid(),
  child_id       uuid not null references children(id) on delete cascade,
  year           int not null,
  week_number    int not null,
  week_start     date not null,
  academic_score numeric(4,2),
  habit_score    numeric(4,2),
  growth_score   numeric(4,2),
  created_at     timestamptz not null default now(),
  unique (child_id, year, week_number)
);

create table if not exists achievements (
  id         uuid primary key default gen_random_uuid(),
  child_id   uuid not null references children(id) on delete cascade,
  badge_type text not null,
  earned_at  timestamptz not null default now(),
  meta       jsonb,
  unique (child_id, badge_type)
);

create table if not exists encouragements (
  id             uuid primary key default gen_random_uuid(),
  child_id       uuid not null references children(id) on delete cascade,
  message        text not null,
  author         text not null,
  author_user_id uuid references users(id),
  created_at     timestamptz not null default now()
);

create table if not exists journal_entries (
  id                uuid primary key default gen_random_uuid(),
  child_id          uuid not null references children(id) on delete cascade,
  entry_date        date not null,
  went_well         text[] not null default '{}',
  to_improve        text[] not null default '{}',
  next_goals        text[] not null default '{}',
  parent_reflection text,
  created_at        timestamptz not null default now()
);

create table if not exists daily_checkins (
  id           uuid primary key default gen_random_uuid(),
  child_id     uuid not null references children(id) on delete cascade,
  checkin_date date not null,
  created_at   timestamptz not null default now(),
  unique (child_id, checkin_date)
);

-- ---------------------------------------------------------------------------
-- Row-Level Security
-- Every row is reachable from a family the current user belongs to.
-- Helper: the set of family ids the authenticated user is a member of.
-- ---------------------------------------------------------------------------
create or replace function auth_family_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select family_id from family_members where user_id = auth.uid()
$$;

alter table users            enable row level security;
alter table families         enable row level security;
alter table family_members   enable row level security;
alter table children         enable row level security;
alter table rewards          enable row level security;
alter table scores           enable row level security;
alter table academic_goals   enable row level security;
alter table habits           enable row level security;
alter table habit_checkins   enable row level security;
alter table weekly_snapshots enable row level security;
alter table achievements     enable row level security;
alter table encouragements   enable row level security;
alter table journal_entries  enable row level security;
alter table daily_checkins   enable row level security;

-- users: a user sees / edits only their own profile row
drop policy if exists "self profile" on users;
create policy "self profile" on users
  for all using (id = auth.uid()) with check (id = auth.uid());

-- families: members can read; only the owner can modify
drop policy if exists "family read" on families;
create policy "family read" on families
  for select using (id in (select auth_family_ids()));
drop policy if exists "family owner write" on families;
create policy "family owner write" on families
  for all using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());

-- family_members: members can read their family's membership
drop policy if exists "membership read" on family_members;
create policy "membership read" on family_members
  for select using (family_id in (select auth_family_ids()));

-- family_members: a user may add themselves (bootstrap), owners may manage all
drop policy if exists "membership self insert" on family_members;
create policy "membership self insert" on family_members
  for insert with check (user_id = auth.uid());
drop policy if exists "membership owner manage" on family_members;
create policy "membership owner manage" on family_members
  for all
  using (family_id in (select id from families where owner_user_id = auth.uid()))
  with check (family_id in (select id from families where owner_user_id = auth.uid()));

-- Family-scoped tables (children, rewards): full access for members
do $$
declare t text;
begin
  foreach t in array array['children', 'rewards'] loop
    execute format('drop policy if exists "family access" on %I', t);
    execute format(
      'create policy "family access" on %I for all
         using (family_id in (select auth_family_ids()))
         with check (family_id in (select auth_family_ids()))', t);
  end loop;
end $$;

-- Child-scoped tables: access when the child belongs to one of my families
do $$
declare t text;
begin
  foreach t in array array[
    'scores', 'academic_goals', 'habits', 'weekly_snapshots',
    'achievements', 'encouragements', 'journal_entries', 'daily_checkins'
  ] loop
    execute format('drop policy if exists "child access" on %I', t);
    execute format(
      'create policy "child access" on %I for all
         using (child_id in (select id from children where family_id in (select auth_family_ids())))
         with check (child_id in (select id from children where family_id in (select auth_family_ids())))', t);
  end loop;
end $$;

-- habit_checkins: reached via habit -> child -> family
drop policy if exists "habit checkin access" on habit_checkins;
create policy "habit checkin access" on habit_checkins for all
  using (
    habit_id in (
      select h.id from habits h
      join children c on c.id = h.child_id
      where c.family_id in (select auth_family_ids())
    )
  )
  with check (
    habit_id in (
      select h.id from habits h
      join children c on c.id = h.child_id
      where c.family_id in (select auth_family_ids())
    )
  );

-- ---------------------------------------------------------------------------
-- Storage: child photos
-- Public bucket (stable URLs, no signing). Object paths are `${familyId}/${childId}`,
-- so the UUIDs make URLs effectively unguessable. Writes are limited to members
-- of the owning family; reads are public. Switch `public` to false + use signed
-- URLs if you need stricter privacy.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('child-photos', 'child-photos', true)
on conflict (id) do update set public = true;

-- Anyone can read (public bucket).
drop policy if exists "child photos public read" on storage.objects;
create policy "child photos public read" on storage.objects
  for select using (bucket_id = 'child-photos');

-- Only members of the family (folder = familyId) may write.
drop policy if exists "child photos family insert" on storage.objects;
create policy "child photos family insert" on storage.objects
  for insert with check (
    bucket_id = 'child-photos'
    and (storage.foldername(name))[1] in (select auth_family_ids()::text)
  );

drop policy if exists "child photos family update" on storage.objects;
create policy "child photos family update" on storage.objects
  for update
  using (
    bucket_id = 'child-photos'
    and (storage.foldername(name))[1] in (select auth_family_ids()::text)
  )
  with check (
    bucket_id = 'child-photos'
    and (storage.foldername(name))[1] in (select auth_family_ids()::text)
  );

drop policy if exists "child photos family delete" on storage.objects;
create policy "child photos family delete" on storage.objects
  for delete using (
    bucket_id = 'child-photos'
    and (storage.foldername(name))[1] in (select auth_family_ids()::text)
  );
