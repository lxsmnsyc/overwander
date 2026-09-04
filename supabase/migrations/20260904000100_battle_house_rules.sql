-- The house rule a fight was held under.
--
-- A Battle Frontier facility does not field a harder party, it fights
-- under its own terms: the Pyramid is walked with nothing in hand and
-- the Arena is judged on the clock. A rule changes what the engine
-- does, so it is kept beside the limits and the sky rather than
-- derived from who was standing there: the window that staged the
-- Brain is gone within the hour, and a fight replays as the fight it
-- was.
--
-- Zero is no rule, which is every fight in the game but a Frontier
-- one. See FrontierRule in src/data/overworld/experts.ts.
alter table battles
  add column rules smallint not null default 0;

comment on column battles.rules is
  'The Frontier house rule the fight was held under; 0 for an ordinary fight';

-- How many of the reporting player's party were down when the fight
-- ended.
--
-- The Frontier hangs a gold symbol on taking a house without losing a
-- pokemon, and the report that settles a battle is the only place
-- that knows. It is the client's word, like the health beside it, and
-- it is written once per player per battle by the same marker row.
alter table battle_aftermaths
  add column fainted smallint not null default 0;

comment on column battle_aftermaths.fainted is
  'How many of that player''s party ended the fight down; what a gold symbol is judged on';
