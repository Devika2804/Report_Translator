-- Run via `supabase db push` / migration, or paste into SQL Editor.
-- Adds profile columns and RLS policies for self-service user rows.

alter table users
  add column if not exists name text,
  add column if not exists phone text;

drop policy if exists "Users can insert own profile" on users;
create policy "Users can insert own profile"
  on users for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on users;
create policy "Users can update own profile"
  on users for update
  using (auth.uid() = id);
