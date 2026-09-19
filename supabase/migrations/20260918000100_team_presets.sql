-- Team presets: a party a player saved for themselves, so forming one
-- for a raid or a duel is a press rather than six.
--
-- It holds catch ids rather than a snapshot, the way a raid team does:
-- a preset follows whatever those pokemon become, and a released one
-- leaves the preset with the cascade. What it names may still be
-- unusable when it is loaded (fainted, locked, already fighting), so
-- nothing here promises a preset can be fielded; the picker says what
-- it could not take.

create table team_presets (
  id      text primary key,
  player  uuid not null references auth.users(id) on delete cascade,
  name    text not null,
  made_at bigint not null
);

create index team_presets_player on team_presets (player);

create table team_preset_catches (
  preset_id text not null references team_presets(id) on delete cascade,
  slot      smallint not null check (slot between 0 and 5),
  caught_id text not null references caught(id) on delete cascade,
  primary key (preset_id, slot),
  unique (preset_id, caught_id)
);

create index team_preset_catches_preset on team_preset_catches (preset_id);
create index team_preset_catches_caught on team_preset_catches (caught_id);

-- Tier 2: a preset is the player's own note to themselves, so only
-- they may read it
alter table team_presets enable row level security;
create policy read on team_presets for select to authenticated using (player = auth.uid());

alter table team_preset_catches enable row level security;
create policy read on team_preset_catches for select to authenticated using (
  exists (
    select 1 from team_presets
    where team_presets.id = team_preset_catches.preset_id and team_presets.player = auth.uid()
  )
);

-- The blanket grant in the RLS migration only reached the tables that
-- existed then, so every table added since names its own
grant select on team_presets to authenticated;
grant select on team_preset_catches to authenticated;
grant all on team_presets to service_role;
grant all on team_preset_catches to service_role;

comment on table team_presets is
  'Parties a player saved for themselves, loaded when a fight asks for a team';
