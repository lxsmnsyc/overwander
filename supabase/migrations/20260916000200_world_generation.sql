-- Which generation of the world each row tied to the ground was written
-- against: 1 is the Perlin world everything so far stood on, 2 the
-- simplex one. `Generation` in src/overworld/world.ts.
--
-- A build reads and writes only its own generation, so switching one
-- hides the other's towns, seats, positions and claims rather than
-- deleting them, and switching back brings them back. The generation
-- is part of each key because the ids are built from chunk seeds,
-- which read the same in both.
--
-- Every existing row is the first generation. The default only
-- backfills them and is then dropped, so a write that forgets its
-- generation fails instead of landing in the wrong world.

alter table positions         add column generation smallint not null default 1;
alter table towns             add column generation smallint not null default 1;
alter table gym_seats         add column generation smallint not null default 1;
alter table gym_challenges    add column generation smallint not null default 1;
alter table raids             add column generation smallint not null default 1;
alter table rocket_stops      add column generation smallint not null default 1;
alter table rocket_party      add column generation smallint not null default 1;
alter table snapshots         add column generation smallint not null default 1;
alter table snapshot_spawns   add column generation smallint not null default 1;
alter table encounters        add column generation smallint not null default 1;
alter table encounter_moves   add column generation smallint not null default 1;
alter table encounter_items   add column generation smallint not null default 1;
alter table encounter_abilities add column generation smallint not null default 1;
alter table fled_encounters   add column generation smallint not null default 1;
alter table cache_claims      add column generation smallint not null default 1;
alter table cache_claim_items add column generation smallint not null default 1;
alter table berry_claims      add column generation smallint not null default 1;
alter table nest_claims       add column generation smallint not null default 1;
alter table phenomenon_claims add column generation smallint not null default 1;
alter table npc_claims        add column generation smallint not null default 1;

alter table positions         alter column generation drop default;
alter table towns             alter column generation drop default;
alter table gym_seats         alter column generation drop default;
alter table gym_challenges    alter column generation drop default;
alter table raids             alter column generation drop default;
alter table rocket_stops      alter column generation drop default;
alter table rocket_party      alter column generation drop default;
alter table snapshots         alter column generation drop default;
alter table snapshot_spawns   alter column generation drop default;
alter table encounters        alter column generation drop default;
alter table encounter_moves   alter column generation drop default;
alter table encounter_items   alter column generation drop default;
alter table encounter_abilities alter column generation drop default;
alter table fled_encounters   alter column generation drop default;
alter table cache_claims      alter column generation drop default;
alter table cache_claim_items alter column generation drop default;
alter table berry_claims      alter column generation drop default;
alter table nest_claims       alter column generation drop default;
alter table phenomenon_claims alter column generation drop default;
alter table npc_claims        alter column generation drop default;

-- Children first, so no foreign key points at a key being replaced
alter table gym_challenges      drop constraint gym_challenges_seat_id_fkey;
alter table rocket_party        drop constraint rocket_party_stop_id_player_fkey;
alter table snapshot_spawns     drop constraint snapshot_spawns_chunk_seed_zone_fkey;
alter table encounter_moves     drop constraint encounter_moves_spawn_id_player_fkey;
alter table encounter_items     drop constraint encounter_items_spawn_id_player_fkey;
alter table encounter_abilities drop constraint encounter_abilities_spawn_id_player_fkey;
alter table cache_claim_items   drop constraint cache_claim_items_marker_player_fkey;

alter table positions drop constraint positions_pkey;
alter table positions add primary key (player, generation);

alter table towns drop constraint towns_pkey;
alter table towns add primary key (generation, region_x, region_y);

alter table gym_seats drop constraint gym_seats_pkey;
alter table gym_seats add primary key (generation, seat_id);
alter table gym_challenges drop constraint gym_challenges_pkey;
alter table gym_challenges add primary key (generation, seat_id, challenger);
alter table gym_challenges add foreign key (generation, seat_id)
  references gym_seats (generation, seat_id) on delete cascade;

alter table rocket_stops drop constraint rocket_stops_pkey;
alter table rocket_stops add primary key (generation, stop_id, player);
alter table rocket_party drop constraint rocket_party_pkey;
alter table rocket_party add primary key (generation, stop_id, player, slot);
alter table rocket_party add foreign key (generation, stop_id, player)
  references rocket_stops (generation, stop_id, player) on delete cascade;

alter table snapshots drop constraint snapshots_pkey;
alter table snapshots add primary key (generation, chunk_seed, zone);
alter table snapshot_spawns drop constraint snapshot_spawns_pkey;
alter table snapshot_spawns add primary key (generation, chunk_seed, zone, idx);
alter table snapshot_spawns add foreign key (generation, chunk_seed, zone)
  references snapshots (generation, chunk_seed, zone) on delete cascade;

alter table encounters drop constraint encounters_pkey;
alter table encounters add primary key (generation, spawn_id, player);
alter table encounter_moves drop constraint encounter_moves_pkey;
alter table encounter_moves add primary key (generation, spawn_id, player, slot);
alter table encounter_moves add foreign key (generation, spawn_id, player)
  references encounters (generation, spawn_id, player) on delete cascade;
alter table encounter_items drop constraint encounter_items_pkey;
alter table encounter_items add primary key (generation, spawn_id, player, slot);
alter table encounter_items add foreign key (generation, spawn_id, player)
  references encounters (generation, spawn_id, player) on delete cascade;
alter table encounter_abilities drop constraint encounter_abilities_pkey;
alter table encounter_abilities add primary key (generation, spawn_id, player, slot);
alter table encounter_abilities add foreign key (generation, spawn_id, player)
  references encounters (generation, spawn_id, player) on delete cascade;

alter table fled_encounters drop constraint fled_encounters_pkey;
alter table fled_encounters add primary key (player, generation, key);

alter table cache_claims drop constraint cache_claims_pkey;
alter table cache_claims add primary key (generation, marker, player);
alter table cache_claim_items drop constraint cache_claim_items_pkey;
alter table cache_claim_items add primary key (generation, marker, player, item);
alter table cache_claim_items add foreign key (generation, marker, player)
  references cache_claims (generation, marker, player) on delete cascade;

alter table berry_claims drop constraint berry_claims_pkey;
alter table berry_claims add primary key (generation, marker, player);
alter table nest_claims drop constraint nest_claims_pkey;
alter table nest_claims add primary key (generation, marker, player);
alter table phenomenon_claims drop constraint phenomenon_claims_pkey;
alter table phenomenon_claims add primary key (generation, marker, player);
alter table npc_claims drop constraint npc_claims_pkey;
alter table npc_claims add primary key (generation, marker, player);

-- A raid keeps its text id, which teams, battles, invites, watchers and
-- rewards all point at. A second-generation raid's id carries the
-- generation instead, so the two worlds never mint the same one
create index raids_generation on raids (generation, window_at);

-- The snapshot a browser publishes names its generation too. The old
-- signature is dropped, so a tab still on an older build cannot
-- publish into whichever world it guesses
drop function publish_snapshot(text, text, integer, bigint, jsonb);

create function publish_snapshot(
  p_generation smallint,
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
  if p_generation not in (1, 2) then
    raise exception 'bad generation';
  end if;
  if jsonb_typeof(p_spawns) <> 'array' or jsonb_array_length(p_spawns) > 64 then
    raise exception 'bad spawns';
  end if;

  insert into snapshots (generation, chunk_seed, zone, utc_offset, window_at)
  values (p_generation, p_seed, p_zone, p_offset, p_window)
  on conflict (generation, chunk_seed, zone) do update
    set utc_offset = excluded.utc_offset, window_at = excluded.window_at
    where snapshots.window_at < excluded.window_at;

  if not found then
    return;
  end if;

  delete from snapshot_spawns
  where generation = p_generation and chunk_seed = p_seed and zone = p_zone;
  insert into snapshot_spawns
    (generation, chunk_seed, zone, idx, species, individual_value, trait_value)
  select p_generation, p_seed, p_zone, ord - 1,
         (s->>'species')::integer,
         (s->>'individualValue')::integer,
         (s->>'traitValue')::integer
  from jsonb_array_elements(p_spawns) with ordinality as t(s, ord);
end;
$$;

revoke execute on function publish_snapshot from public;
grant execute on function publish_snapshot to authenticated;
