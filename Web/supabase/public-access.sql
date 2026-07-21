-- ============================================================================
-- Public (no-login) sharing for Growth Tracker
-- ----------------------------------------------------------------------------
-- Run this in the Supabase SQL editor AFTER schema.sql.
--
-- WHAT THIS DOES
--   * Creates ONE shared "public family" that the app uses without any login.
--   * Grants the anonymous (`anon`) API role full read/write on every app table
--     and on the child-photos storage bucket.
--   * Seeds the two children so the app isn't empty on first load.
--
-- SECURITY NOTE (read this):
--   This makes the data PUBLIC. Anyone who has the app URL + the public anon key
--   (shipped in the browser bundle) can READ and EDIT everything. That is the
--   intended model for a private family tool shared by link. Do NOT store
--   sensitive information. To lock it down later, delete the "public anon ..."
--   policies below and switch the app back to login-based access.
--
-- Safe to re-run (idempotent).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Fixed ids for the shared family (keep in sync with VITE_PUBLIC_FAMILY_ID)
-- ---------------------------------------------------------------------------
-- placeholder owner user : 00000000-0000-0000-0000-000000000000
-- public family          : 11111111-1111-1111-1111-111111111111
-- child "Hiếu"           : 22222222-2222-2222-2222-222222222222
-- child "Hân"            : 33333333-3333-3333-3333-333333333333

-- Placeholder owner (families.owner_user_id is NOT NULL and FKs to users).
insert into users (id, email, display_name)
values ('00000000-0000-0000-0000-000000000000', 'public@growthtracker.local', 'Public Family')
on conflict (id) do nothing;

insert into families (id, name, owner_user_id)
values (
  '11111111-1111-1111-1111-111111111111',
  'Our Family',
  '00000000-0000-0000-0000-000000000000'
)
on conflict (id) do nothing;

-- Seed the two children (so the app shows content immediately).
insert into children (id, family_id, name, grade, avatar, color, birth_year)
values
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111',
   'Nguyễn Bảo Hiếu', 'Preparing for Grade 8', '👦', '#0891b2', 2013),
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111',
   'Nguyễn Thị Bảo Hân', 'Grade 3', '👧', '#e11d48', 2018)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 2. Make sure the anon API role has table privileges (Supabase default, but
--    we assert it so this file is self-contained).
-- ---------------------------------------------------------------------------
grant usage on schema public to anon;
grant select, insert, update, delete on all tables in schema public to anon;
grant usage, select on all sequences in schema public to anon;

-- ---------------------------------------------------------------------------
-- 3. Permissive RLS policies for the anonymous role on every app table.
--    RLS combines permissive policies with OR, so these coexist with the
--    login-based policies from schema.sql (which still apply to authenticated
--    users). Removing them re-locks the data to logged-in family members.
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'users', 'families', 'family_members', 'children', 'rewards', 'scores',
    'academic_goals', 'habits', 'habit_checkins', 'weekly_snapshots',
    'achievements', 'encouragements', 'journal_entries', 'daily_checkins'
  ] loop
    execute format('drop policy if exists "public anon access" on %I', t);
    execute format(
      'create policy "public anon access" on %I for all to anon
         using (true) with check (true)', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 4. Storage: let anon read/write the child-photos bucket.
-- ---------------------------------------------------------------------------
drop policy if exists "public anon photos" on storage.objects;
create policy "public anon photos" on storage.objects
  for all to anon
  using (bucket_id = 'child-photos')
  with check (bucket_id = 'child-photos');
