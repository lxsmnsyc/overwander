-- Battle lobbies: two players fighting each other on purpose, plus
-- whoever they call in to watch.
--
-- A duel is staged rather than found. Nothing in the world opens one,
-- so it lives on invitations alone and is readable only by the people
-- standing in it. The party each side brings is a list of catch ids
-- until the host starts, exactly as a raid team is, and the fight it
-- becomes is an ordinary battle row with a player on both sides --
-- which is what keeps it out of every aftermath. See recordAftermath,
-- which refuses any battle with two players in it.

create table duels (
  id         text primary key,
  host       uuid not null references auth.users(id) on delete cascade,
  battle_id  text,
  created_at bigint not null
);

create index duels_host on duels (host);

-- Everyone standing in the lobby. Two of them fight at most; the rest
-- are watching, the host included when they staged the fight for
-- somebody else
create table duel_members (
  duel_id    text not null references duels(id) on delete cascade,
  player     uuid not null references auth.users(id) on delete cascade,
  role       smallint not null,
  -- A fighter says when their party is the one they mean to bring.
  -- Only then may the host start, which is what a duel has and a raid
  -- does not: there are two of them, and both chose to be here
  ready      boolean not null default false,
  joined_seq bigint generated always as identity,
  primary key (duel_id, player)
);

create index duel_members_player on duel_members (player);

-- The party a fighter has assembled, by catch id. It is theirs to
-- change until the host starts, and changing it takes their ready
-- back
create table duel_catches (
  duel_id   text not null,
  player    uuid not null,
  slot      smallint not null check (slot between 0 and 5),
  -- A pokemon released while it was waiting in a lobby takes its
  -- place in that party with it, rather than refusing the release
  caught_id text not null references caught(id) on delete cascade,
  primary key (duel_id, player, slot),
  unique (duel_id, player, caught_id),
  foreign key (duel_id, player) references duel_members (duel_id, player) on delete cascade
);

create index duel_catches_caught on duel_catches (caught_id);

-- One call per lobby and player, carrying what they are called in as:
-- somebody to fight, or somebody to watch
create table duel_invites (
  duel_id   text not null references duels(id) on delete cascade,
  sender    uuid not null references auth.users(id) on delete cascade,
  recipient uuid not null references auth.users(id) on delete cascade,
  role      smallint not null,
  sent_at   bigint not null,
  primary key (duel_id, recipient),
  check (sender <> recipient)
);

create index duel_invites_recipient on duel_invites (recipient);

-- Whether somebody has any business seeing a lobby: they are in it, or
-- they have been called into it.
--
-- A function rather than a subquery written into the policies, because
-- a policy on duel_members that reads duel_members is recursion, which
-- Postgres refuses outright. Security definer runs it as the owner,
-- where no policy applies
create function in_duel(target text, who uuid) returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from duel_members where duel_id = target and player = who
  ) or exists (
    select 1 from duel_invites where duel_id = target and recipient = who
  );
$$;

revoke execute on function in_duel from public;
grant execute on function in_duel to authenticated;

-- Tier 2 throughout: a duel is private, which is the whole of what
-- separates it from a raid lobby standing open in the world
alter table duels enable row level security;
create policy read on duels for select to authenticated
  using (host = auth.uid() or in_duel(id, auth.uid()));

alter table duel_members enable row level security;
create policy read on duel_members for select to authenticated
  using (in_duel(duel_id, auth.uid()));

alter table duel_catches enable row level security;
create policy read on duel_catches for select to authenticated
  using (in_duel(duel_id, auth.uid()));

alter table duel_invites enable row level security;
create policy read on duel_invites for select to authenticated
  using (sender = auth.uid() or recipient = auth.uid());

grant select on duels to authenticated;
grant all on duels to service_role;
grant select on duel_members to authenticated;
grant all on duel_members to service_role;
grant select on duel_catches to authenticated;
grant all on duel_catches to service_role;
grant select on duel_invites to authenticated;
grant all on duel_invites to service_role;

-- Everything in a lobby moves while somebody is looking at it: a
-- second player arriving, a party assembled, a ready taken back, the
-- host's start
alter publication supabase_realtime add table
  duels, duel_members, duel_catches, duel_invites;
alter table duels replica identity full;
alter table duel_members replica identity full;
alter table duel_catches replica identity full;
alter table duel_invites replica identity full;

-- Who is standing in a raid lobby without a party.
--
-- A raid has always had onlookers -- anybody may walk up to a lair and
-- watch, and a player with no pokemon of their own can do nothing else
-- -- and until now the lobby had no way to say so. The row is the
-- player's own presence: written on the way in, dropped on the way
-- out, and taken by the cascade when the lobby goes
create table raid_watchers (
  raid_id text not null references raids(id) on delete cascade,
  player  uuid not null references auth.users(id) on delete cascade,
  seen_at bigint not null,
  primary key (raid_id, player)
);

create index raid_watchers_player on raid_watchers (player);

-- Tier 1, the way the lobby itself is: who is watching a raid is as
-- public as who has joined it
alter table raid_watchers enable row level security;
create policy read on raid_watchers for select to authenticated using (true);

grant select on raid_watchers to authenticated;
grant all on raid_watchers to service_role;

alter publication supabase_realtime add table raid_watchers;
alter table raid_watchers replica identity full;

-- What a friend is being called into a raid as. Everything sent before
-- now was a call to fight, which is the default
alter table raid_invites add column role smallint not null default 0;
