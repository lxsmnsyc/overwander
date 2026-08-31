-- What the last handover looked like, beside the fact that there was
-- one.
--
-- `traded` says a pokemon has changed hands and is what the box search
-- reads. It is not enough to gate a trade evolution, because the
-- mainline asks two things about the handover that a bare flag cannot
-- answer:
--
--   * **what it was at the time.** A Machop traded and then levelled
--     into a Machoke was never traded as a Machoke, so it is not owed
--     a Machamp. Four Gen 1 lines evolve by trade and all four sit one
--     level evolution above the stage that changed hands.
--   * **what it was traded for.** A Karrablast becomes an Escavalier
--     only when the pokemon coming the other way is a Shelmet, and
--     vice versa. It is the only condition in the family that is about
--     somebody else's pokemon.
--
-- Both are null where nothing has changed hands, and `traded_for` is
-- null for a handover with no counterpart: an auction is a sale, and
-- nobody handed anything back.
alter table caught
  add column traded_as  smallint,
  add column traded_for smallint;

-- What has already been traded keeps the evolution it was standing on:
-- read as what it is now, which is what the bare flag meant
update caught set traded_as = species where traded;

comment on column caught.traded_as is
  'Species at the last handover; null for a pokemon that has never changed hands';
comment on column caught.traded_for is
  'Species that came the other way; null for a sale or any handover with no counterpart';
