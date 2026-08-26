-- Gym seats: the one place in the world where players fight each
-- other.
--
-- A seat belongs to a cell rather than to a window, which is what
-- separates it from every other staged fight in the schema. A grunt
-- is rolled from the chunk seed and gone in three hours; a seat is
-- held by whoever last took it, for as long as nobody takes it off
-- them.
--
-- The party standing on it is a `team_snapshots` row: a frozen copy,
-- so the holder walks away with their pokemon still theirs to use.
-- Nothing here locks a catch, and a fight against a seat settles no
-- aftermath — see recordAftermath, which refuses any battle with two
-- players in it.

create table gym_seats (
  -- Derived from the chunk and the cell, so the id names the place
  seat_id     text primary key,
  holder      uuid not null references auth.users(id) on delete cascade,
  -- The frozen party the challenger actually fights
  snapshot_id text not null references team_snapshots(id),
  chunk_seed  text not null,
  chunk_x     integer not null,
  chunk_y     integer not null,
  cell        integer not null,
  seated_at   bigint not null,
  -- How many challenges this holder has turned away on this seat. It
  -- resets with the holder, since it describes the stand rather than
  -- the place
  defenses    integer not null default 0
);

create index gym_seats_holder on gym_seats (holder);

-- One challenge in flight per seat per challenger. The row is the
-- claim: it carries the battle the challenge became, and the outcome
-- is read off that battle rather than stored twice
create table gym_challenges (
  seat_id      text not null references gym_seats(seat_id) on delete cascade,
  challenger   uuid not null references auth.users(id) on delete cascade,
  battle_id    text not null references battles(id),
  -- Whose seat it was when the challenge was accepted. A challenge
  -- that lands after somebody else has taken the seat pays nothing:
  -- what was beaten is not what is standing there now
  held_by      uuid not null references auth.users(id),
  started_at   bigint not null,
  settled      boolean not null default false,
  primary key (seat_id, challenger)
);

create index gym_challenges_battle on gym_challenges (battle_id);

alter table gym_seats enable row level security;
-- Tier 1: a seat is a public fact about a cell, the way a raid lobby
-- is. Who is holding it is the whole reason to walk there
create policy read on gym_seats for select to authenticated using (true);

alter table gym_challenges enable row level security;
create policy read on gym_challenges for select to authenticated
  using (challenger = auth.uid() or held_by = auth.uid());

-- The blanket grant in the RLS migration only reached the tables that
-- existed then, so every table added since names its own
grant select on gym_seats to authenticated;
grant all on gym_seats to service_role;
grant select on gym_challenges to authenticated;
grant all on gym_challenges to service_role;

-- A seat changing hands is worth seeing from across the chunk, so it
-- rides the same live stream the raid lobbies do
alter publication supabase_realtime add table gym_seats;
alter table gym_seats replica identity full;
