-- The lowest level whose level-up moves a pokemon may still learn for
-- free. Null means only the level it stands on, which is every candy
-- but a Rare Candy Max: that one leaves the whole run it jumped open.

alter table public.caught add column learn_from smallint
  constraint caught_learn_from_check check (learn_from >= 1 and learn_from <= 100);
