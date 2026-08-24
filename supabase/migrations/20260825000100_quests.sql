-- Quests: lifetime progress counters and one claim row per quest.
--
-- Both tables are closed to clients end to end; a client that could
-- write its own counters could write itself rewards. Progress is a
-- (metric, param) grid per player -- metric numbers match the Metric
-- enum in src/auth/quest-record.ts: 0 catches (param species),
-- 1 hatches (param species), 2 level-ups, 3 item uses (param item),
-- 4 steps, 5 npc visits (param npc, -1 for visits older than the
-- counters), 6 landmarks (param 0 cache, 1 berry, 2 nest,
-- 3 phenomenon), 7 raid runs, 8 raid wins, 9 trades, 10 friends,
-- 11 auctions.

create table quest_progress (
  player uuid not null references auth.users(id) on delete cascade,
  metric smallint not null,
  param  integer not null default 0,
  count  bigint not null default 0,
  primary key (player, metric, param)
);

create table quest_claims (
  player     uuid not null references auth.users(id) on delete cascade,
  quest      integer not null,
  claimed_at bigint not null,
  primary key (player, quest)
);

alter table quest_progress enable row level security;
alter table quest_claims enable row level security;

-- Backfill from what the game already wrote down, so the counters do
-- not start every veteran at zero. Steps, level-ups and item uses
-- left nothing behind to count and start fresh.

insert into quest_progress (player, metric, param, count)
select owner, 0, species, count(*) from caught
where owner is not null and not egg and type <> 1
group by owner, species;

insert into quest_progress (player, metric, param, count)
select owner, 1, species, count(*) from caught
where owner is not null and not egg and type = 1
group by owner, species;

insert into quest_progress (player, metric, param, count)
select player, 5, -1, count(*) from npc_claims group by player;

insert into quest_progress (player, metric, param, count)
select player, 5, 6, count(*) from rocket_stops where defeated group by player;

insert into quest_progress (player, metric, param, count)
select player, 6, 0, count(*) from cache_claims group by player;

insert into quest_progress (player, metric, param, count)
select player, 6, 1, count(*) from berry_claims group by player;

insert into quest_progress (player, metric, param, count)
select player, 6, 2, count(*) from nest_claims group by player;

insert into quest_progress (player, metric, param, count)
select player, 6, 3, count(*) from phenomenon_claims group by player;

insert into quest_progress (player, metric, param, count)
select a.player, 7, 0, count(*) from battle_aftermaths a
join battles b on b.id = a.battle_id
where b.raid_id is not null group by a.player;

insert into quest_progress (player, metric, param, count)
select a.player, 8, 0, count(*) from battle_aftermaths a
join battles b on b.id = a.battle_id
where b.raid_id is not null and b.outcome = 1 group by a.player;

insert into quest_progress (player, metric, param, count)
select player, 9, 0, count(*) from (
  select proposer as player from trades where status = 1
  union all
  select receiver from trades where status = 1
) settled group by player;

insert into quest_progress (player, metric, param, count)
select owner, 10, 0, count(*) from friends group by owner;
