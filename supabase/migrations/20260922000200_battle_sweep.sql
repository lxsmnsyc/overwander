-- Sweeping the finished fights.
--
-- A battle keeps a frozen party per side, and a party of six is about
-- a kilobyte and a half of jsonb. Nothing deleted any of it, so every
-- rocket stop, gym challenge, duel and raid anybody ever fought stayed
-- whole. A month is what the history screens reach back over; past
-- that the rows answer no question.
--
-- Four tables pointed at `battles` and only `battle_teams` cascaded,
-- so each of them is told here what to do when its battle goes. A
-- challenge cannot outlive its battle. A rocket stop is swept at a
-- day old anyway and only needs to not stand in the way.

alter table battle_aftermaths drop constraint battle_aftermaths_battle_id_fkey;
alter table battle_aftermaths add foreign key (battle_id)
  references battles (id) on delete cascade;

alter table gym_challenges drop constraint gym_challenges_battle_id_fkey;
alter table gym_challenges add foreign key (battle_id)
  references battles (id) on delete cascade;

alter table raid_rewards drop constraint raid_rewards_raid_id_fkey;
alter table raid_rewards add foreign key (raid_id)
  references raids (id) on delete cascade;

alter table rocket_stops drop constraint rocket_stops_battle_id_fkey;
alter table rocket_stops add foreign key (battle_id)
  references battles (id) on delete set null;

-- Nothing points from a team snapshot, so the only way to find a
-- spent one is that nothing points at it. A snapshot is written
-- before the battle that names it, so the pass leaves the last hour
-- alone rather than taking a party out of a fight being staged. The
-- default stamps every later insert without a caller saying so.
alter table team_snapshots add column created_at bigint not null
  default (extract(epoch from now()) * 1000)::bigint;

create index battles_swept on battles (started_at);
create index team_snapshots_swept on team_snapshots (created_at);
create index battle_teams_snapshot on battle_teams (snapshot_id);
create index gym_seats_snapshot on gym_seats (snapshot_id) where snapshot_id is not null;

-- A raid is kept while any battle still names it, so neither sweep
-- has to run before the other. A seated gym holder's party is old on
-- purpose and is held by the seat, which is why the pass asks.
select cron.schedule(
  'sweep-old-battles',
  '11 * * * *',
  $$
  delete from battles
  where started_at < (extract(epoch from now()) * 1000)::bigint - 2592000000;

  delete from raids
  where window_at < (extract(epoch from now()) * 1000)::bigint - 2592000000
    and not exists (select 1 from battles where battles.raid_id = raids.id);

  delete from team_snapshots ts
  where ts.created_at < (extract(epoch from now()) * 1000)::bigint - 3600000
    and not exists (select 1 from battle_teams bt where bt.snapshot_id = ts.id)
    and not exists (select 1 from gym_seats gs where gs.snapshot_id = ts.id);
  $$
);
