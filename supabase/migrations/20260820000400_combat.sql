-- Combat: raids, teams, the frozen team snapshots, battles and their
-- one-shot settlement markers.
--
-- Ids that carry meaning stay text: a raid id is a deterministic
-- derivation of place and window, and a battle id doubles as the
-- fight's RNG seed and replay key.

create table raids (
  id          text primary key,
  kind        smallint not null,
  lair        smallint,
  species     integer not null,
  trait_value integer not null,
  host        uuid not null references auth.users(id),
  battle_id   text,
  window_at   bigint not null,
  utc_offset  smallint not null,
  chunk_seed  text not null,
  chunk_x     integer not null,
  chunk_y     integer not null,
  biome       smallint not null,
  cell        integer not null,
  cleared     boolean not null default false
);

create index raids_window on raids (window_at, utc_offset);

-- One row per joiner; the identity column keeps host-first ordering
-- where the old document kept an array
create table teams (
  id         text primary key,
  player     uuid not null references auth.users(id) on delete cascade,
  raid_id    text not null references raids(id) on delete cascade,
  joined_seq bigint generated always as identity
);

create index teams_player on teams (player);
create index teams_raid on teams (raid_id);

create table team_catches (
  team_id   text not null references teams(id) on delete cascade,
  slot      smallint not null check (slot between 0 and 5),
  caught_id text not null references caught(id),
  primary key (team_id, slot),
  unique (team_id, caught_id)
);

create index team_catches_caught on team_catches (caught_id);

-- A sealed replay artifact: written once when the battle freezes the
-- party, read whole by the engine, never queried per field. That is
-- why the catches ride as jsonb in a schema that otherwise normalizes
create table team_snapshots (
  id       text primary key,
  player   uuid references auth.users(id),
  alliance smallint not null,
  catches  jsonb not null check (jsonb_typeof(catches) = 'array')
);

create table battles (
  id         text primary key,
  raid_id    text references raids(id),
  species    integer not null,
  outcome    smallint not null default 0,
  started_at bigint not null,
  limits     integer not null
);

-- battle_id carries no FK on purpose: starting a raid claims the id
-- on the lobby row first, in its own transaction, and only then
-- writes the battle. A claim whose battle never lands is a designed
-- state — it reads as lost and the lobby restages.

-- Replaces the teams[] and players[] arrays; the boss row has no player
create table battle_teams (
  battle_id   text not null references battles(id) on delete cascade,
  position    smallint not null,
  snapshot_id text not null references team_snapshots(id),
  player      uuid references auth.users(id),
  primary key (battle_id, position)
);

create index battle_teams_player on battle_teams (player) where player is not null;

create table rocket_stops (
  stop_id    text not null,
  player     uuid not null references auth.users(id) on delete cascade,
  battle_id  text references battles(id),
  window_at  bigint not null,
  utc_offset smallint not null,
  chunk_seed text not null,
  chunk_x    integer not null,
  chunk_y    integer not null,
  cell       integer not null,
  defeated   boolean not null default false,
  primary key (stop_id, player)
);

-- The grunt's three, weakest first, frozen at the challenge
create table rocket_party (
  stop_id          text not null,
  player           uuid not null,
  slot             smallint not null check (slot between 0 and 2),
  species          integer not null,
  individual_value integer not null,
  trait_value      integer not null,
  primary key (stop_id, player, slot),
  foreign key (stop_id, player) references rocket_stops on delete cascade
);

create table raid_rewards (
  raid_id text not null references raids(id),
  player  uuid not null references auth.users(id) on delete cascade,
  gold    integer not null,
  primary key (raid_id, player)
);

create table battle_aftermaths (
  battle_id  text not null references battles(id),
  player     uuid not null references auth.users(id) on delete cascade,
  settled_at bigint not null,
  primary key (battle_id, player)
);
