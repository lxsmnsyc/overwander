-- The pokemon folded into a fusion, reserved ahead of the feature.
--
-- A fusion is one pokemon standing in the world with another inside
-- it: Kyurem is the base and takes the stats, Reshiram is the one
-- folded in. Both rows survive the join, which is what lets the pair
-- come apart again, so the one inside has to say so.
--
-- Nothing reads it yet.
alter table caught add column hidden boolean not null default false;

comment on column caught.hidden is
  'Whether this is the pokemon folded into a base, and so not out in the world';
