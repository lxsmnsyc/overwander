-- A duel host may cap the base stat total a pokemon brings (0 for no
-- cap) and bar legendaries, mythicals and held-item forms, packed as
-- the DuelBan flags in src/data/constants/duel-bans.ts.

alter table public.duels
  add column max_bst smallint not null default 0,
  add column bans smallint not null default 0,
  add constraint duels_max_bst_range check (max_bst >= 0 and max_bst <= 680),
  add constraint duels_bans_range check (bans >= 0 and bans <= 7);
