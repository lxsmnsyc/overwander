-- The towns players have walked into: the world's shared register of
-- where anybody has been.
--
-- There is no name here, and that is the point. A town's name is
-- worked out from the region it stands in (`src/data/overworld/town-names.ts`),
-- and every region of a county lands on a name of its own, so two
-- towns can never share one and nothing has to be reserved. What this
-- table holds is the one fact a derivation cannot answer: whether
-- anybody has actually been there.
--
-- Every row is public. A town one player found is a town everybody can
-- travel to, which is the whole point: the portals cross to a town off
-- this register, so a name told to a friend is a place they can reach.

create table towns (
  -- The region it was sited in, which is the whole of its identity:
  -- one town to a region, always in the same place, and the name falls
  -- out of these two numbers
  region_x integer not null,
  region_y integer not null,
  -- Who walked in first, and when. Nothing is spent on it and nothing
  -- is paid for it: it is the record of who put the town on the map
  found_by uuid references auth.users(id) on delete set null,
  found_at bigint  not null,
  primary key (region_x, region_y)
);

alter table towns enable row level security;
-- Tier 1: a town is a public fact about the world, the way a gym seat
-- is a public fact about a cell
create policy read on towns for select to authenticated using (true);

-- The blanket grant in the RLS migration only reached the tables that
-- existed then, so every table added since names its own
grant select on towns to authenticated;
grant all on towns to service_role;

comment on table towns is
  'Regions somebody has walked a town in; the name is derived, never stored';
