-- One player's run through one dungeon in one window.
--
-- The floors are derived from the chunk and the window, so only what the
-- player changed is stored: which floor they are on, where they stand on
-- it, what they have beaten and taken, and the party they locked in at
-- the entrance. A lost fight clears the run back to the entrance; what
-- was looted stays looted for the window, so a restart pays nothing twice.

create table dungeon_runs (
  generation  smallint not null,
  run_id      text not null,
  player      uuid not null references auth.users(id) on delete cascade,
  kind        smallint not null,
  window_at   bigint not null,
  utc_offset  smallint not null,
  chunk_seed  text not null,
  chunk_x     integer not null,
  chunk_y     integer not null,
  depth       smallint not null,
  cell        integer not null,
  -- The catch ids locked in at the entrance; empty until a run starts
  party       jsonb not null default '[]',
  floor       smallint not null default 0,
  -- Where the player stands on the floor; null before a run starts
  state       jsonb,
  -- Rooms beaten on this floor
  beaten      jsonb not null default '[]',
  -- Stashes taken this window, as "floor:room"
  looted      jsonb not null default '[]',
  battle_id   text references battles(id) on delete set null,
  battle_room smallint,
  cleared     boolean not null default false,
  primary key (generation, run_id, player)
);

alter table dungeon_runs enable row level security;
create policy read on dungeon_runs for select to authenticated using (player = auth.uid());

create index dungeon_runs_swept on dungeon_runs (window_at);

select cron.schedule(
  'sweep-old-dungeon-runs',
  '41 * * * *',
  $$
  delete from dungeon_runs
  where window_at < (extract(epoch from now()) * 1000)::bigint - 86400000;
  $$
);
