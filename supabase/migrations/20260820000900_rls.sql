-- The whole security surface in one file, the way firestore.rules was
-- one file. Server writes arrive over the direct postgres connection
-- as the table owner, which RLS does not bind, so every policy below
-- describes what a signed-in browser may do and nothing else.
--
-- Three tiers, as before:
--   1. readable by any signed-in player
--   2. readable only by the player named on the row
--   3. closed (gifts): RLS on, no policies at all

-- Tier 1
alter table caught enable row level security;
create policy read on caught for select to authenticated using (true);
alter table caught_moves enable row level security;
create policy read on caught_moves for select to authenticated using (true);
alter table caught_abilities enable row level security;
create policy read on caught_abilities for select to authenticated using (true);
alter table caught_items enable row level security;
create policy read on caught_items for select to authenticated using (true);
alter table caught_history enable row level security;
create policy read on caught_history for select to authenticated using (true);
alter table snapshots enable row level security;
create policy read on snapshots for select to authenticated using (true);
alter table snapshot_spawns enable row level security;
create policy read on snapshot_spawns for select to authenticated using (true);
alter table auctions enable row level security;
create policy read on auctions for select to authenticated using (true);
alter table raids enable row level security;
create policy read on raids for select to authenticated using (true);
alter table teams enable row level security;
create policy read on teams for select to authenticated using (true);
alter table team_catches enable row level security;
create policy read on team_catches for select to authenticated using (true);
alter table team_snapshots enable row level security;
create policy read on team_snapshots for select to authenticated using (true);
alter table battles enable row level security;
create policy read on battles for select to authenticated using (true);
alter table battle_teams enable row level security;
create policy read on battle_teams for select to authenticated using (true);
alter table rocket_stops enable row level security;
create policy read on rocket_stops for select to authenticated using (true);
alter table rocket_party enable row level security;
create policy read on rocket_party for select to authenticated using (true);

-- Tier 2
alter table bag_items enable row level security;
create policy read on bag_items for select to authenticated using (player = auth.uid());
alter table bag_candies enable row level security;
create policy read on bag_candies for select to authenticated using (player = auth.uid());
alter table pokedex_entries enable row level security;
create policy read on pokedex_entries for select to authenticated using (player = auth.uid());
alter table positions enable row level security;
create policy read on positions for select to authenticated using (player = auth.uid());
alter table fled_encounters enable row level security;
create policy read on fled_encounters for select to authenticated using (player = auth.uid());
alter table encounters enable row level security;
create policy read on encounters for select to authenticated using (player = auth.uid());
alter table encounter_moves enable row level security;
create policy read on encounter_moves for select to authenticated using (player = auth.uid());
alter table encounter_items enable row level security;
create policy read on encounter_items for select to authenticated using (player = auth.uid());
alter table encounter_abilities enable row level security;
create policy read on encounter_abilities for select to authenticated using (player = auth.uid());
alter table bids enable row level security;
create policy read on bids for select to authenticated using (player = auth.uid());
alter table auction_sellers enable row level security;
create policy read on auction_sellers for select to authenticated using (player = auth.uid());
alter table friends enable row level security;
create policy read on friends for select to authenticated using (owner = auth.uid());
alter table friend_requests enable row level security;
create policy read on friend_requests for select to authenticated
  using (sender = auth.uid() or recipient = auth.uid());
alter table blocks enable row level security;
create policy read on blocks for select to authenticated using (blocker = auth.uid());

-- Claim markers: scoped to their own player. The old rules let any
-- signed-in player list these; that was a leak, not a feature
alter table cache_claims enable row level security;
create policy read on cache_claims for select to authenticated using (player = auth.uid());
alter table cache_claim_items enable row level security;
create policy read on cache_claim_items for select to authenticated using (player = auth.uid());
alter table berry_claims enable row level security;
create policy read on berry_claims for select to authenticated using (player = auth.uid());
alter table nest_claims enable row level security;
create policy read on nest_claims for select to authenticated using (player = auth.uid());
alter table phenomenon_claims enable row level security;
create policy read on phenomenon_claims for select to authenticated using (player = auth.uid());
alter table npc_claims enable row level security;
create policy read on npc_claims for select to authenticated using (player = auth.uid());
alter table raid_rewards enable row level security;
create policy read on raid_rewards for select to authenticated using (player = auth.uid());
alter table battle_aftermaths enable row level security;
create policy read on battle_aftermaths for select to authenticated using (player = auth.uid());

-- Tier 3: closed. RLS on, no policies: nobody signed in or out reads
-- a shelf or a claim except through the server
alter table gifts enable row level security;
alter table gift_claims enable row level security;

-- Profiles: the one client-writable table. Everyone reads every
-- profile (a trade starts with looking); a player creates their own
-- with nothing in the purse and no role, and may change only the
-- cosmetics and the buddy afterwards. The column restriction rides on
-- grants, which say what RLS cannot.
alter table profiles enable row level security;
create policy read on profiles for select to authenticated using (true);
create policy create_own on profiles for insert to authenticated
  with check (
    id = auth.uid() and gold = 0 and role = '' and banned = false
    and ban_reason = '' and buddy_id is null
  );
create policy update_own on profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

revoke insert, update on profiles from authenticated;
grant select on profiles to authenticated;
grant insert (id, nickname, avatar) on profiles to authenticated;
grant update (nickname, avatar, buddy_id) on profiles to authenticated;

-- The stack's default privileges hand client roles nothing, so the
-- grants are explicit. SELECT everywhere for the signed-in role (the
-- policies above decide which rows that yields; the closed gift
-- tables have no policy and so yield none); the service role is the
-- server's door and takes everything
grant usage on schema public to anon, authenticated, service_role;
grant select on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;
