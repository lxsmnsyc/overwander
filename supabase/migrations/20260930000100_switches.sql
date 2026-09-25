-- Switches: whole parts of the game closed without a deploy.
--
-- When something turns out to be exploitable, the fix is a deploy
-- away, and until it lands the hole stays open. A switch closes the
-- part of the game it lives in instead, from the dashboard, in the
-- time it takes to tick a box. The server reads the switches in the
-- same statement as the ban check and the paces, so they cost no round
-- trip.
--
-- A closed switch refuses new things only: opening an auction, taking
-- a trade, walking into a fight. Leaving, cancelling, reading and
-- settling a fight already under way stay open, so closing a switch
-- never strands anybody halfway.
--
-- `everything` is maintenance: it refuses every call from anybody
-- without a role, so staff can still check the game before opening it
-- again. `message` is what players are told, and the game's own line
-- is used when it is empty.
--
-- Anybody signed in may read the switches, so a screen can say a part
-- is closed before a player tries it. Only the owner writes them.

create table switches (
  feature text primary key,
  closed  boolean not null default false,
  message text not null default ''
);

insert into switches (feature) values
  ('everything'),
  ('auctions'),
  ('trades'),
  ('stops'),
  ('raids'),
  ('duels'),
  ('gym-seats'),
  ('gifts'),
  ('townsfolk'),
  ('catching'),
  ('claims');

alter table switches enable row level security;

create policy "switches are read by players"
  on switches
  for select
  to authenticated
  using (true);

grant select on switches to authenticated;
