-- Whether the pokemon has already earned the handover a trade
-- evolution asks for.
--
-- It replaces `traded_as` and `traded_for`, which stored the handover
-- and worked the answer out on every read. The question is settled the
-- moment the swap happens, so it is answered there instead: a Machop
-- traded gets false, because Machop has no trade evolution, and it is
-- still false after it levels into a Machoke nobody ever traded. A
-- Karrablast gets true only when a Shelmet came the other way.
--
-- `traded` stays, and stays separate: it says a pokemon has changed
-- hands, which is what the box search reads, and that is true of the
-- Machop this column refuses.
--
-- It is spent by the evolution it opens and cleared by any other
-- change of species, so it can never be read by a shape that did not
-- earn it.
alter table caught add column can_evolve boolean not null default false;

-- What is already standing on a handover keeps it. The list is the
-- species that evolve by trade today, since a row's `traded_as` only
-- opened anything for those
update caught
set can_evolve = true
where traded_as in (61, 64, 67, 75, 79, 93, 95, 117, 123, 137);

alter table caught
  drop column traded_as,
  drop column traded_for;

comment on column caught.can_evolve is
  'Whether a handover has already met the condition a trade evolution asks for';
