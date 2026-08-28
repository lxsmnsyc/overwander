-- Where a fight is standing, so the field can be drawn in the ground
-- the fight is happening on.
--
-- Stored rather than derived, for the reason `limits` is: a raid's
-- lobby is cleared when the raid ends and a rocket stop is a row of
-- the player's own, so a battle that had to chase either would lose
-- its setting the moment somebody watched it back. Beyond is the
-- default because it is the one biome that is not a place: a lobby
-- duel is fought nowhere, and nowhere draws the plain field.
alter table battles add column biome smallint not null default 24;
