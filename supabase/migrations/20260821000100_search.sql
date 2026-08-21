-- What a box search can ask the store.
--
-- The search runs in two passes and pushes whatever narrows into a
-- query (see src/auth/catch-search.ts). Postgres can answer far more
-- of one than the document store could, but three shapes are not
-- queryable as stored: bits inside a packed integer, a difference
-- between two columns, and a substring of a name. The generated
-- columns below turn the first two into plain columns, and the
-- trigram indexes make the third cheap.

create extension if not exists pg_trgm;

-- The six individual values, five bits each in stat order. Stored
-- generated rather than expression-indexed so PostgREST can filter on
-- them by name
alter table caught
  add column iv_hp    smallint generated always as ((ivs >> 0)  & 31) stored,
  add column iv_atk   smallint generated always as ((ivs >> 5)  & 31) stored,
  add column iv_def   smallint generated always as ((ivs >> 10) & 31) stored,
  add column iv_spa   smallint generated always as ((ivs >> 15) & 31) stored,
  add column iv_spd   smallint generated always as ((ivs >> 20) & 31) stored,
  add column iv_spe   smallint generated always as ((ivs >> 25) & 31) stored,
  add column iv_total smallint generated always as (
    ((ivs >> 0)  & 31) + ((ivs >> 5)  & 31) + ((ivs >> 10) & 31) +
    ((ivs >> 15) & 31) + ((ivs >> 20) & 31) + ((ivs >> 25) & 31)
  ) stored,
  -- The six statuses a record carries out of a battle. A mask cannot
  -- be compared a bit at a time in a filter, so each bit is its own
  -- column
  add column status_poisoned       boolean generated always as ((statuses & 1)  <> 0) stored,
  add column status_badly_poisoned boolean generated always as ((statuses & 2)  <> 0) stored,
  add column status_sleeping       boolean generated always as ((statuses & 4)  <> 0) stored,
  add column status_paralyzed      boolean generated always as ((statuses & 8)  <> 0) stored,
  add column status_burned         boolean generated always as ((statuses & 16) <> 0) stored,
  add column status_frozen         boolean generated always as ((statuses & 32) <> 0) stored,
  -- How much further an egg has to be carried, which is what somebody
  -- searching for the one about to hatch means
  add column hatch_left integer generated always as (greatest(hatch_steps - steps, 0)) stored;

-- Names are searched by substring, which no ordinary index answers
create index caught_nickname_trgm on caught using gin (nickname gin_trgm_ops)
  where nickname <> '';
create index caught_place_trgm on caught using gin (origin_place gin_trgm_ops)
  where origin_place is not null;
create index caught_history_owner_name on caught_history (owner_name)
  where owner_name is not null;

-- The child tables are joined the other way round by a search: from
-- the move or the ability to the pokemon that has it
create index caught_moves_move on caught_moves (move);
create index caught_abilities_ability on caught_abilities (ability);
create index caught_items_item on caught_items (item);

-- Every search is a box, so the owner leads. Postgres combines these
-- with each other, which is why one per field is enough where
-- Firestore needed one per combination
create index caught_owner_species on caught (owner, species);
create index caught_owner_level on caught (owner, level);
create index caught_owner_friendship on caught (owner, friendship);
create index caught_owner_iv_total on caught (owner, iv_total);
