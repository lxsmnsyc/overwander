-- Functions and triggers: the snapshot publish, the write-once guards,
-- buddy ownership, the monotonic dex, and the fled sweep.

-- The one client write besides the profile. The client still rolls
-- the deterministic window itself; this only checks the shape and
-- refuses to move a window backwards, then swaps the spawn rows
-- atomically. The server re-derives all value from seed + window, so
-- a dishonest publisher only lies to itself.
create function publish_snapshot(
  p_seed text,
  p_zone text,
  p_offset integer,
  p_window bigint,
  p_spawns jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  if jsonb_typeof(p_spawns) <> 'array' or jsonb_array_length(p_spawns) > 64 then
    raise exception 'bad spawns';
  end if;

  insert into snapshots (chunk_seed, zone, utc_offset, window_at)
  values (p_seed, p_zone, p_offset, p_window)
  on conflict (chunk_seed, zone) do update
    set utc_offset = excluded.utc_offset, window_at = excluded.window_at
    where snapshots.window_at < excluded.window_at;

  -- A stale or losing publisher changed nothing, so it swaps nothing
  if not found then
    return;
  end if;

  delete from snapshot_spawns where chunk_seed = p_seed and zone = p_zone;
  insert into snapshot_spawns (chunk_seed, zone, idx, species, individual_value, trait_value)
  select p_seed, p_zone, ord - 1,
         (s->>'species')::integer,
         (s->>'individualValue')::integer,
         (s->>'traitValue')::integer
  from jsonb_array_elements(p_spawns) with ordinality as t(s, ord);
end;
$$;

revoke execute on function publish_snapshot from public;
grant execute on function publish_snapshot to authenticated;

-- Turns "the server happens not to rewrite these" into "the database
-- will not": claim markers and frozen artifacts refuse being changed.
-- Deletes stay allowed, because a released catch and a removed account
-- take their rows with them by cascade, and a cascade fires row
-- triggers too
create function forbid_change() returns trigger
language plpgsql as $$
begin
  raise exception '% rows are write-once', tg_table_name;
end;
$$;

create trigger write_once before update on cache_claims
  for each row execute function forbid_change();
create trigger write_once before update on cache_claim_items
  for each row execute function forbid_change();
create trigger write_once before update on berry_claims
  for each row execute function forbid_change();
create trigger write_once before update on nest_claims
  for each row execute function forbid_change();
create trigger write_once before update on phenomenon_claims
  for each row execute function forbid_change();
create trigger write_once before update on raid_rewards
  for each row execute function forbid_change();
create trigger write_once before update on battle_aftermaths
  for each row execute function forbid_change();
create trigger write_once before update on team_snapshots
  for each row execute function forbid_change();
-- History is append-only with one lawful exception: the cascade that
-- nulls `owner` when its account is deleted. Everything else in the
-- row stays frozen, and a fresh row must name somebody — the account
-- or a story trainer
create function guard_history() returns trigger
language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    if new.owner is null and new.owner_name is null then
      raise exception 'caught_history rows must name an owner';
    end if;
    return new;
  end if;
  if new.owner is null and old.owner is not null
    and new.caught_id = old.caught_id
    and new.seq = old.seq
    and new.owner_name is not distinct from old.owner_name
    and new.acquired_at_local = old.acquired_at_local
    and new.acquired_at_offset = old.acquired_at_offset
    and new.kind = old.kind
    and new.paid is not distinct from old.paid
    and new.ball is not distinct from old.ball
  then
    return new;
  end if;
  raise exception '% rows are write-once', tg_table_name;
end;
$$;

create trigger append_only before insert or update on caught_history
  for each row execute function guard_history();

-- The nurse's claim is a quota, not a visit, so it may be rewritten;
-- npc_claims deliberately carries no write-once trigger. A gift claim
-- is backfilled once with the catch id it became, so it allows exactly
-- that one update.
create function guard_gift_claim() returns trigger
language plpgsql as $$
begin
  if old.catch_id is not null
     or new.gift_id <> old.gift_id
     or new.player <> old.player
     or new.claimed_at <> old.claimed_at then
    raise exception 'gift_claims only backfill catch_id once';
  end if;
  return new;
end;
$$;

create trigger backfill_only before update on gift_claims
  for each row execute function guard_gift_claim();

-- A buddy must be the player's own catch
create function check_buddy_owner() returns trigger
language plpgsql as $$
begin
  if new.buddy_id is not null and not exists (
    select 1 from caught where id = new.buddy_id and owner = new.id
  ) then
    raise exception 'buddy must be an owned catch';
  end if;
  return new;
end;
$$;

create trigger buddy_owner before insert or update of buddy_id on profiles
  for each row execute function check_buddy_owner();

-- An auctioned or traded buddy stops walking beside its old owner
create function clear_stale_buddy() returns trigger
language plpgsql as $$
begin
  update profiles set buddy_id = null
  where buddy_id = new.id and id is distinct from new.owner;
  return new;
end;
$$;

create trigger buddy_follows_owner after update of owner on caught
  for each row execute function clear_stale_buddy();

-- Dex counts only ever rise
create function check_dex_monotonic() returns trigger
language plpgsql as $$
begin
  if new.seen < old.seen or new.seen_shiny < old.seen_shiny
     or new.caught < old.caught or new.caught_shiny < old.caught_shiny then
    raise exception 'dex counts never decrease';
  end if;
  return new;
end;
$$;

create trigger dex_monotonic before update on pokedex_entries
  for each row execute function check_dex_monotonic();

-- The outcome stamps once, from Unfinished, and nothing else moves
create function guard_battle_update() returns trigger
language plpgsql as $$
begin
  if old.outcome <> 0 then
    raise exception 'battle already settled';
  end if;
  if new.id <> old.id or new.raid_id is distinct from old.raid_id
     or new.species <> old.species or new.started_at <> old.started_at
     or new.limits <> old.limits then
    raise exception 'only the outcome of a battle may change';
  end if;
  return new;
end;
$$;

create trigger settle_once before update on battles
  for each row execute function guard_battle_update();

-- A bare profile row for every new account, so e2e staging and FKs
-- never depend on the app having run
create function handle_new_user() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, nickname)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), 'Trainer')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- Hygiene: readers still filter by the one-hour memory themselves
select cron.schedule(
  'sweep-fled-encounters',
  '17 * * * *',
  $$delete from fled_encounters
    where window_at < (extract(epoch from now()) * 1000)::bigint - 3600000$$
);
