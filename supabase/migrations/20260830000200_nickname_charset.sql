-- What a name a player writes may be made of.
--
-- Two of them are shown to other people: a pokemon's nickname and the
-- player's own. Both are drawn in lists nobody can inspect, so a
-- right-to-left override, a pile of combining marks or a lookalike
-- letter is not decoration there: it is a way to be somebody else or
-- to break the row.
--
-- The rule lives here as well as in the app because `profiles` is the
-- one row a browser writes for itself: `grant update (nickname, ...)`
-- means anything that can reach PostgREST can set it, so the column's
-- own constraint is the only thing that actually holds.
--
-- The alphabet mirrors `src/auth/nickname.ts`: any letter, any decimal
-- digit, and the little punctuation a name needs. Letters of every
-- script, so a player writes their own name rather than a
-- transliteration of it.
--
-- What is left out is what is not a letter. `[[:alpha:]]` under this
-- database's ctype answers the same as JavaScript's `\p{L}` — checked
-- across scripts, marks, bidi controls and zero-width characters by
-- the test beside the RLS suite — so a combining stack, an override
-- that reorders the row and a zero-width character are all dropped by
-- the allowlist rather than by a rule of their own.
--
-- The apostrophe, full stop and hyphen are in it because the species
-- need them (Farfetch'd, Mr. Mime, Porygon-Z); the gender signs are
-- the mainline's own.

-- Shared by the trigger below and by the backfill, so a name cleaned
-- on the way in and a name cleaned in place agree
create function clean_nickname(name text, limit_to integer)
returns text
language sql
immutable
as $$
  -- Collapsed on both sides of the strip, the way src/auth/nickname.ts
  -- does it: once so a tab between words becomes the space it stood
  -- for rather than vanishing and joining them, and again so a dropped
  -- character does not leave a gap where it was
  select btrim(
    left(
      btrim(
        regexp_replace(
          regexp_replace(
            regexp_replace(coalesce(name, ''), '\s+', ' ', 'g'),
            '[^[:alpha:][:digit:] ''.♀♂-]', '', 'g'
          ),
          ' +', ' ', 'g'
        )
      ),
      limit_to
    )
  );
$$;

-- Existing names first: a constraint added over rows that break it
-- would refuse to be added at all
update caught set nickname = clean_nickname(nickname, 24)
  where nickname <> clean_nickname(nickname, 24);

update profiles set nickname = coalesce(nullif(clean_nickname(nickname, 24), ''), 'Trainer')
  where nickname <> coalesce(nullif(clean_nickname(nickname, 24), ''), 'Trainer');

-- A pokemon may have no nickname at all: an empty one is what makes it
-- go by its species. A player may not — every list that draws players
-- would draw a gap
alter table caught add constraint caught_nickname_charset
  check (nickname ~ '^[[:alpha:][:digit:] ''.♀♂-]{0,24}$');

alter table profiles add constraint profiles_nickname_charset
  check (nickname ~ '^[[:alpha:][:digit:] ''.♀♂-]{1,24}$');

-- A provider's display name is whatever the provider says it is, and
-- it lands here without the app ever seeing it. Cleaned on the way in,
-- or the constraint above would refuse the sign-up rather than the name
create or replace function handle_new_user() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
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
