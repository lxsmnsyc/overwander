-- Rotating quests: dailies and the weekly hunt.
--
-- The quests themselves are derived from the date in code; the
-- database only remembers, per player and window, where the lifetime
-- counter stood when the window first saw them (the baseline the
-- delta is measured from) and which slots were claimed. Both tables
-- are closed to clients end to end, the way quest_progress is.

create table rotation_baselines (
  player     uuid not null references auth.users(id) on delete cascade,
  window_key text not null,
  slot       smallint not null,
  baseline   bigint not null default 0,
  primary key (player, window_key, slot)
);

create table rotation_claims (
  player     uuid not null references auth.users(id) on delete cascade,
  window_key text not null,
  slot       smallint not null,
  claimed_at bigint not null,
  primary key (player, window_key, slot)
);

alter table rotation_baselines enable row level security;
alter table rotation_claims enable row level security;
