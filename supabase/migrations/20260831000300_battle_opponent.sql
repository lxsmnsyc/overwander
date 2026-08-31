-- Who a fight was against, where it was against nobody in particular.
--
-- A stop stages a Team Rocket grunt, Giovanni, a duelling trainer, a
-- gym leader, one of the Elite Four or the Champion, and which one is
-- the window's roll. The window is gone an hour later, so a history
-- read back a week afterwards has nothing to derive it from: the name
-- and the coat they were wearing are kept here instead, beside the
-- species a raid already keeps for the same reason.
--
-- Empty for every fight that has a player or a boss on the other side.
alter table battles
  add column opponent        text not null default '',
  add column opponent_sprite text not null default '';

comment on column battles.opponent is
  'Who an unowned side was, for the history; empty for raids and player fights';
comment on column battles.opponent_sprite is
  'The overworld charset they were wearing, under sprites/overworld';
