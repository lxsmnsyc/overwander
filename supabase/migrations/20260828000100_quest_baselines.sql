-- Where a quest's counters stood when the quest opened.
--
-- Quest requirements read the lifetime counters, so a quest waiting
-- behind a prerequisite used to arrive already part-done: a player who
-- had caught two hundred pokemon unlocked "catch five" complete. A
-- baseline row is written when the quest opens and the requirement is
-- measured from it, which is the same trick the rotating board plays
-- per window.
--
-- Only quests behind a prerequisite have rows. One at the head of its
-- chain has been open since the account was, so its counters are its
-- own from the start. `slot` is the requirement's index in the quest,
-- since a quest may ask for more than one thing.
--
-- Closed to clients end to end, the way quest_progress is.

create table quest_baselines (
  player   uuid not null references auth.users(id) on delete cascade,
  quest    integer not null,
  slot     smallint not null,
  baseline bigint not null default 0,
  primary key (player, quest, slot)
);

alter table quest_baselines enable row level security;
