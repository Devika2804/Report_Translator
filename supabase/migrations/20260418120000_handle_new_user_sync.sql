-- Creates a profile row in public.users whenever auth.users gets a new row.
-- Runs as SECURITY DEFINER so it works even when email confirmation leaves the client without a session (RLS would block a browser upsert).

alter table public.users add column if not exists email text;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, name, phone, created_at)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'display_name',
      new.raw_user_meta_data->>'name',
      ''
    ),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(new.created_at, now())
  )
  on conflict (id) do update set
    email = coalesce(nullif(excluded.email, ''), users.email),
    name = case
      when nullif(excluded.name, '') is not null then excluded.name
      else users.name
    end,
    phone = case
      when nullif(excluded.phone, '') is not null then excluded.phone
      else users.phone
    end;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
