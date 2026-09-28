-- Better Auth's two-factor and passkey plugins: an authenticator app's
-- secret and backup codes per account, and each passkey an account
-- has registered. Both are server only, like the other account tables.

alter table public.users add column two_factor_enabled boolean default false;

create table public.two_factors (
    id uuid default gen_random_uuid() not null primary key,
    secret text not null,
    backup_codes text not null,
    user_id uuid not null references public.users(id) on delete cascade,
    verified boolean default true,
    failed_verification_count integer default 0,
    locked_until timestamp with time zone
);

create index two_factors_user_id_idx on public.two_factors using btree (user_id);
create index two_factors_secret_idx on public.two_factors using btree (secret);

create table public.passkeys (
    id uuid default gen_random_uuid() not null primary key,
    name text,
    public_key text not null,
    user_id uuid not null references public.users(id) on delete cascade,
    credential_id text not null,
    counter integer not null,
    device_type text not null,
    backed_up boolean not null,
    transports text,
    created_at timestamp with time zone,
    aaguid text
);

create index passkeys_user_id_idx on public.passkeys using btree (user_id);
create index passkeys_credential_id_idx on public.passkeys using btree (credential_id);
