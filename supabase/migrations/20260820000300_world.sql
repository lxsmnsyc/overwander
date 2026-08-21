-- World: the shared spawn windows, the per-player encounter freezes,
-- positions, fled memory, and the claim markers.
--
-- A claim marker's row *being there* is the whole semantic: the server
-- inserts ON CONFLICT DO NOTHING and the row count says whether this
-- press was the one that landed.

create table snapshots (
  chunk_seed text not null,
  zone       text not null,
  utc_offset smallint not null,
  window_at  bigint not null,
  primary key (chunk_seed, zone)
);

create table snapshot_spawns (
  chunk_seed       text not null,
  zone             text not null,
  idx              smallint not null,
  species          integer not null,
  individual_value integer not null,
  trait_value      integer not null,
  primary key (chunk_seed, zone, idx),
  foreign key (chunk_seed, zone) references snapshots on delete cascade
);

-- The authority on what a player met: the catch is built from this
-- row, so a client cannot describe a better pokemon than it was shown
create table encounters (
  spawn_id         text not null,
  player           uuid not null references auth.users(id) on delete cascade,
  type             smallint not null,
  species          integer not null,
  level            smallint not null,
  individual_value integer not null,
  trait_value      integer not null,
  ivs              integer not null,
  lair             smallint,
  nature           smallint not null,
  ability          integer not null,
  gender           smallint not null,
  shiny            boolean not null,
  shadow           boolean not null,
  window_at        bigint not null,
  x                integer not null,
  y                integer not null,
  biome            smallint not null,
  place            text,
  slots            smallint,
  primary key (spawn_id, player)
);

create table encounter_moves (
  spawn_id text not null,
  player   uuid not null,
  slot     smallint not null,
  move     integer not null,
  primary key (spawn_id, player, slot),
  foreign key (spawn_id, player) references encounters on delete cascade
);

create table encounter_items (
  spawn_id text not null,
  player   uuid not null,
  slot     smallint not null,
  item     integer not null,
  primary key (spawn_id, player, slot),
  foreign key (spawn_id, player) references encounters on delete cascade
);

create table encounter_abilities (
  spawn_id text not null,
  player   uuid not null,
  slot     smallint not null,
  ability  integer not null,
  primary key (spawn_id, player, slot),
  foreign key (spawn_id, player) references encounters on delete cascade
);

-- The one mutable record of a player in the world; nothing trusts it
create table positions (
  player   uuid primary key references auth.users(id) on delete cascade,
  chunk_x  integer not null,
  chunk_y  integer not null,
  cell_x   smallint not null,
  cell_y   smallint not null,
  moved_at bigint not null
);

-- Row per fled key; the hourly sweep is hygiene, readers still filter
-- by the one-hour memory themselves
create table fled_encounters (
  player    uuid not null references auth.users(id) on delete cascade,
  key       text not null,
  window_at bigint not null,
  primary key (player, key)
);

create index fled_window on fled_encounters (window_at);

create table cache_claims (
  marker     text not null,
  player     uuid not null references auth.users(id) on delete cascade,
  claimed_at bigint not null,
  primary key (marker, player)
);

create table cache_claim_items (
  marker text not null,
  player uuid not null,
  item   integer not null,
  amount integer not null,
  primary key (marker, player, item),
  foreign key (marker, player) references cache_claims on delete cascade
);

create table berry_claims (
  marker text not null,
  player uuid not null references auth.users(id) on delete cascade,
  item   integer not null,
  amount integer not null,
  primary key (marker, player)
);

create table nest_claims (
  marker  text not null,
  player  uuid not null references auth.users(id) on delete cascade,
  species integer not null,
  primary key (marker, player)
);

create table phenomenon_claims (
  marker text not null,
  player uuid not null references auth.users(id) on delete cascade,
  kind   smallint not null,
  primary key (marker, player)
);

-- The payload varies by who is standing there (the nurse writes which
-- pokemon she tended); write-once audit data nothing queries by field
create table npc_claims (
  marker  text not null,
  player  uuid not null references auth.users(id) on delete cascade,
  payload jsonb,
  primary key (marker, player)
);
