-- Which layer of the world a player is standing on.
--
-- The overworld derives everything about a place from the seed and
-- the coordinates, and the caves are the same coordinates one layer
-- down. So a position is no longer enough to say where somebody is:
-- the same cell is open ground on the surface and solid rock beneath
-- it, and a reload that guessed wrong would put a player inside a
-- mountain.
--
-- 0 is the surface and 1 is the caves, which is `Depth` in
-- src/overworld/world.ts. Everyone who has ever walked was on the
-- surface, so the default is right for every row that already exists.
alter table positions add column depth smallint not null default 0;

comment on column positions.depth is
  'Which layer the player is on: 0 the surface, 1 the caves';
