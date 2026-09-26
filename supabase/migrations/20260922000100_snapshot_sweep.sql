-- Sweeping the spawn windows.
--
-- A window is rolled from the chunk seed, the zone and its timestamp,
-- and every reader refuses one older than the five minutes it covers.
-- A row past that is unreachable, and derivable again from the seed
-- if it were ever wanted. Nothing deleted them, so a window and its
-- eleven spawns stayed for every chunk and zone anybody had walked,
-- on a world 4096 chunks across.
--
-- The margin is a day, as with the encounter sweep, because
-- `window_at` is local wall clock rather than UTC: it has to cover
-- the zones as well as the window itself. The first pass takes the
-- first generation's windows with it, which is right, since a build
-- that switched back would roll them again.
--
-- snapshot_spawns cascades off its window and needs no statement.

create index snapshots_swept on snapshots (window_at);

select cron.schedule(
  'sweep-stale-snapshots',
  '53 * * * *',
  $$
  delete from snapshots
  where window_at < (extract(epoch from now()) * 1000)::bigint - 86400000;
  $$
);
