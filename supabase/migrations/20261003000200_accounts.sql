-- Accounts move from Supabase Auth to the app's own Better Auth tables.
--
-- Every account keeps its uuid, so the game's foreign keys move over to
-- `users` unchanged. Google and GitHub links carry over from
-- `auth.identities`, and passwords keep their bcrypt hashes, which the
-- server still checks. The tables are the server's alone: no policy
-- lets a browser read them, and `jwks` holds the private signing keys.

create table users (
  id uuid default gen_random_uuid() not null primary key,
  name text not null,
  email text not null unique,
  email_verified boolean not null,
  image text,
  created_at timestamptz default current_timestamp not null,
  updated_at timestamptz default current_timestamp not null
);

create table sessions (
  id uuid default gen_random_uuid() not null primary key,
  expires_at timestamptz not null,
  token text not null unique,
  created_at timestamptz default current_timestamp not null,
  updated_at timestamptz not null,
  ip_address text,
  user_agent text,
  user_id uuid not null references users (id) on delete cascade
);

create table identities (
  id uuid default gen_random_uuid() not null primary key,
  account_id text not null,
  provider_id text not null,
  user_id uuid not null references users (id) on delete cascade,
  access_token text,
  refresh_token text,
  id_token text,
  access_token_expires_at timestamptz,
  refresh_token_expires_at timestamptz,
  scope text,
  password text,
  created_at timestamptz default current_timestamp not null,
  updated_at timestamptz not null
);

create table verifications (
  id uuid default gen_random_uuid() not null primary key,
  identifier text not null,
  value text not null,
  expires_at timestamptz not null,
  created_at timestamptz default current_timestamp not null,
  updated_at timestamptz default current_timestamp not null
);

create table jwks (
  id uuid default gen_random_uuid() not null primary key,
  public_key text not null,
  private_key text not null,
  created_at timestamptz not null,
  expires_at timestamptz,
  alg text,
  crv text
);

create index sessions_user_id_idx on sessions (user_id);
create index identities_user_id_idx on identities (user_id);
create index verifications_identifier_idx on verifications (identifier);

alter table users enable row level security;
alter table sessions enable row level security;
alter table identities enable row level security;
alter table verifications enable row level security;
alter table jwks enable row level security;

-- Only where Supabase's API roles exist, which a self-hosted database has none of
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on users, sessions, identities, verifications, jwks from anon, authenticated;
  end if;
end;
$$;

-- An account made through Supabase Auth, by a build from before the
-- move, lands in `users` too, so its profile still has a user to point at
create or replace function handle_new_user() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into users (id, name, email, email_verified, created_at, updated_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.email, new.id::text || '@no-email.invalid'),
    new.email_confirmed_at is not null,
    coalesce(new.created_at, now()),
    coalesce(new.updated_at, now())
  )
  on conflict (id) do nothing;
  insert into profiles (id, nickname)
  values (
    new.id,
    coalesce(
      nullif(clean_nickname(new.raw_user_meta_data->>'full_name', 24), ''),
      'Trainer'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

do $$
declare
  fk record;
begin
  if to_regclass('auth.users') is null then
    return;
  end if;

  insert into users (id, name, email, email_verified, image, created_at, updated_at)
  select
    u.id,
    coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', ''),
    coalesce(u.email, u.id::text || '@no-email.invalid'),
    u.email_confirmed_at is not null,
    u.raw_user_meta_data->>'avatar_url',
    coalesce(u.created_at, now()),
    coalesce(u.updated_at, now())
  from auth.users u
  on conflict (id) do nothing;

  insert into identities (account_id, provider_id, user_id, created_at, updated_at)
  select i.provider_id, i.provider, i.user_id, coalesce(i.created_at, now()), coalesce(i.updated_at, now())
  from auth.identities i
  where i.provider in ('google', 'github');

  insert into identities (account_id, provider_id, user_id, password, created_at, updated_at)
  select u.id::text, 'credential', u.id, u.encrypted_password, coalesce(u.created_at, now()), now()
  from auth.users u
  where coalesce(u.encrypted_password, '') <> '';

  for fk in
    select conrelid::regclass as tbl, conname, pg_get_constraintdef(oid) as def
    from pg_constraint
    where confrelid = 'auth.users'::regclass and connamespace = 'public'::regnamespace
  loop
    execute format('alter table %s drop constraint %I', fk.tbl, fk.conname);
    execute format(
      'alter table %s add constraint %I %s',
      fk.tbl,
      fk.conname,
      replace(fk.def, 'REFERENCES auth.users(id)', 'REFERENCES users(id)')
    );
  end loop;
end;
$$;
