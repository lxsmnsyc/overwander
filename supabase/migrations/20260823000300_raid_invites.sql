-- Raid invites: a player in a lobby calling a friend into it.
--
-- One row per lobby and friend, whoever sent it first; the row goes
-- when the raid does, when the friend dismisses it, or when they join
-- and the invite has done its work.

create table raid_invites (
  raid_id   text not null references raids(id) on delete cascade,
  sender    uuid not null references auth.users(id) on delete cascade,
  recipient uuid not null references auth.users(id) on delete cascade,
  sent_at   bigint not null,
  primary key (raid_id, recipient),
  check (sender <> recipient)
);

create index raid_invites_recipient on raid_invites (recipient);

-- A trade of attention between two players and nobody else's business
alter table raid_invites enable row level security;
create policy read on raid_invites for select to authenticated
  using (sender = auth.uid() or recipient = auth.uid());

grant select on raid_invites to authenticated;
grant all on raid_invites to service_role;

-- The invited list updates live, both when one arrives and when the
-- raid it names clears
alter publication supabase_realtime add table raid_invites;
alter table raid_invites replica identity full;
