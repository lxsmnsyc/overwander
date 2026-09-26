-- Sweeping the duel lobbies.
--
-- A lobby was deleted only when its host walked out of it. One that
-- reached a fight stayed for good, holding its members, their parties
-- and the battle id they followed into the fight.
--
-- A day, so the row is still there for anybody rejoining the fight it
-- staged, and gone well before the battle it names is. Members,
-- parties and invites all cascade off the lobby.

create index duels_swept on duels (created_at);

select cron.schedule(
  'sweep-old-lobbies',
  '37 * * * *',
  $$
  delete from duels
  where created_at < (extract(epoch from now()) * 1000)::bigint - 86400000;
  $$
);
