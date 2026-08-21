-- Core: the player profile and the catch record with its children.
--
-- Packed integers survive the move: ivs (six 5-bit stats), slots
-- (three 3-bit counts), statuses (a 6-bit mask) and the two 32-bit
-- rolls are consumed whole by the engine, so unpacking them into
-- columns would only build a shape the code immediately re-packs.
-- The two rolls are signed 32-bit by construction (Alea's int32),
-- so they fit integer columns exactly.

create table caught (
  id               text primary key,
  -- NULL owner is auction escrow: no policy ever matches it, and the
  -- FK stays honest where the old '' sentinel could not
  owner            uuid references auth.users(id) on delete cascade,
  type             smallint not null,
  species          integer  not null,
  nickname         text not null default '',
  level            smallint not null check (level between 1 and 100),
  individual_value integer  not null,
  trait_value      integer  not null,
  ivs              integer  not null check (ivs between 0 and 1073741823),
  gender           smallint not null,
  nature           smallint not null,
  shiny       boolean not null default false,
  shadow      boolean not null default false,
  egg         boolean not null default false,
  favorite    boolean not null default false,
  guarded     boolean not null default false,
  traded      boolean not null default false,
  -- Advisory, server-derived; the opener re-derives before trusting it
  auctionable boolean not null default false,
  slots            smallint not null check (slots between 0 and 511),
  locked_at        bigint not null default 0,
  steps            integer not null default 0,
  hatch_steps      integer not null default 0,
  stepped_at       bigint not null default 0,
  health           integer not null check (health >= 0),
  statuses         smallint not null default 0 check (statuses between 0 and 63),
  lair             smallint,
  ball             integer not null,
  -- The catcher's wall clock and their zone, kept apart so the
  -- year/month searches stay plain range scans
  caught_at_local  timestamp not null,
  caught_at_offset smallint not null,
  locale           text not null default '',
  ev_hp  smallint not null default 0,
  ev_atk smallint not null default 0,
  ev_def smallint not null default 0,
  ev_spa smallint not null default 0,
  ev_spd smallint not null default 0,
  ev_spe smallint not null default 0,
  effort_bonus     smallint not null default 0,
  walked           integer not null default 0,
  friendship       smallint not null check (friendship between 0 and 255),
  origin_timestamp bigint not null,
  origin_x         integer not null,
  origin_y         integer not null,
  origin_biome     smallint not null,
  origin_place     text
);

create index caught_owner on caught (owner) where owner is not null;
create index caught_owner_caught_at on caught (owner, caught_at_local);

-- Moves and their PP Ups travel together: a move put over by another
-- loses its points with it
create table caught_moves (
  caught_id text not null references caught(id) on delete cascade,
  slot      smallint not null check (slot between 0 and 6),
  move      integer not null,
  points    smallint not null default 0 check (points between 0 and 3),
  primary key (caught_id, slot),
  unique (caught_id, move)
);

create table caught_abilities (
  caught_id text not null references caught(id) on delete cascade,
  slot      smallint not null,
  ability   integer not null,
  primary key (caught_id, slot),
  unique (caught_id, ability)
);

create table caught_items (
  caught_id text not null references caught(id) on delete cascade,
  slot      smallint not null,
  item      integer not null,
  primary key (caught_id, slot)
);

-- Append-only. A story trainer ("Red") is a name with no account, so
-- a row arrives with the account or the name — the guard trigger in
-- the functions migration enforces it. It is not a table check
-- because a deleted account nulls `owner` by cascade, and a check
-- runs against that update too: it would leave an account with any
-- history to its name impossible to delete
create table caught_history (
  caught_id          text not null references caught(id) on delete cascade,
  seq                smallint not null,
  owner              uuid references auth.users(id) on delete set null,
  owner_name         text,
  acquired_at_local  timestamp not null,
  acquired_at_offset smallint not null,
  kind               smallint not null,
  paid               bigint check (paid >= 0),
  ball               integer,
  primary key (caught_id, seq)
);

create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  nickname   text not null default 'Trainer',
  avatar     text,
  gold       bigint not null default 0 check (gold >= 0),
  role       text not null default '',
  banned     boolean not null default false,
  ban_reason text not null default '',
  buddy_id   text references caught(id) on delete set null
);

create index profiles_buddy on profiles (buddy_id) where buddy_id is not null;

-- A stack spent to its last is deleted, never stored at zero
create table bag_items (
  player uuid not null references auth.users(id) on delete cascade,
  item   integer not null,
  count  integer not null check (count > 0),
  primary key (player, item)
);

create table bag_candies (
  player  uuid not null references auth.users(id) on delete cascade,
  family  integer not null,
  count   integer not null check (count > 0),
  primary key (player, family)
);

-- Counts are historical: releasing or trading never decrements them
create table pokedex_entries (
  player       uuid not null references auth.users(id) on delete cascade,
  species      integer not null,
  seen         integer not null default 0 check (seen >= 0),
  seen_shiny   integer not null default 0 check (seen_shiny >= 0),
  caught       integer not null default 0 check (caught >= 0),
  caught_shiny integer not null default 0 check (caught_shiny >= 0),
  primary key (player, species)
);
