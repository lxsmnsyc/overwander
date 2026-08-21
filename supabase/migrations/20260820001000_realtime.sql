-- What the browser watches live. postgres_changes checks RLS per
-- socket, so the tier-1 read policies above are what make these
-- streams visible; the tier-2 tables stream only their own rows.
alter publication supabase_realtime add table
  battles, auctions, raids, teams, snapshots, snapshot_spawns,
  friends, friend_requests, blocks, profiles, battle_teams;

-- The board watches merge deletes and filtered updates client-side,
-- which needs the old row on the wire
alter table auctions replica identity full;
alter table raids replica identity full;
alter table teams replica identity full;
alter table friends replica identity full;
alter table friend_requests replica identity full;
alter table blocks replica identity full;
alter table battle_teams replica identity full;
