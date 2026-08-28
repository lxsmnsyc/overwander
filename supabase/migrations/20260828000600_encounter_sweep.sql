-- The last two tables that kept what a rolled window left behind.
--
-- A wild encounter is keyed by the spawn that staged it, and a spawn
-- key carries the five-minute window in it, so the row is unreachable
-- the moment that window turns over. A Team Rocket stop is the same
-- with a three-hour window. Both already carried `window_at`, so
-- neither needs a column, only somewhere to look it up.
--
-- Only the **wild** encounters go. The others are things the player is
-- owed rather than things the world happened to show: a mystery gift
-- and a raid's prize are keyed by the gift or the raid rather than by
-- a spawn, and a shadow taken off a beaten grunt is the prize for the
-- fight. None of those expires, and a sweep that took them would take
-- a pokemon somebody won.
--
-- A day, as with the claim markers: eight times the longest window
-- either table uses, so nothing is ever swept out from under a player
-- still standing in front of it.

create index encounters_swept on encounters (window_at) where type = 0;
create index rocket_stops_swept on rocket_stops (window_at);

-- Their children cascade, so neither needs a statement of its own
select cron.schedule(
  'sweep-stale-encounters',
  '29 * * * *',
  $$
  delete from encounters
  where type = 0 and window_at < (extract(epoch from now()) * 1000)::bigint - 86400000;
  delete from rocket_stops
  where window_at < (extract(epoch from now()) * 1000)::bigint - 86400000;
  $$
);
