-- The whole schema as of the move off Supabase, in one file.
--
-- Squashed from the 66 migrations that were under supabase/migrations,
-- without what only Supabase used: row-level security and its
-- policies, the API roles' grants, the realtime publication and its
-- bag broadcast, and the SQL functions the browser once called. Every
-- read and write now goes through the server, over the owner connection.

create extension if not exists pg_cron;
create extension if not exists pg_trgm with schema public;

set check_function_bodies = false;

CREATE FUNCTION public.check_buddy_owner() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  if new.buddy_id is not null and not exists (
    select 1 from caught where id = new.buddy_id and owner = new.id
  ) then
    raise exception 'buddy must be an owned catch';
  end if;
  return new;
end;
$$;

CREATE FUNCTION public.check_dex_monotonic() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  if new.seen < old.seen or new.seen_shiny < old.seen_shiny
     or new.caught < old.caught or new.caught_shiny < old.caught_shiny then
    raise exception 'dex counts never decrease';
  end if;
  return new;
end;
$$;

CREATE FUNCTION public.clean_nickname(name text, limit_to integer) RETURNS text
    LANGUAGE sql IMMUTABLE
    AS $$
  -- Collapsed on both sides of the strip, the way src/auth/nickname.ts
  -- does it: once so a tab between words becomes the space it stood
  -- for rather than vanishing and joining them, and again so a dropped
  -- character does not leave a gap where it was
  select btrim(
    left(
      btrim(
        regexp_replace(
          regexp_replace(
            regexp_replace(coalesce(name, ''), '\s+', ' ', 'g'),
            '[^[:alpha:][:digit:] ''.♀♂-]', '', 'g'
          ),
          ' +', ' ', 'g'
        )
      ),
      limit_to
    )
  );
$$;

CREATE FUNCTION public.clear_stale_buddy() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  update profiles set buddy_id = null
  where buddy_id = new.id and id is distinct from new.owner;
  return new;
end;
$$;

CREATE FUNCTION public.forbid_change() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  raise exception '% rows are write-once', tg_table_name;
end;
$$;

CREATE FUNCTION public.guard_battle_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  if old.outcome <> 0 then
    raise exception 'battle already settled';
  end if;
  if new.id <> old.id or new.raid_id is distinct from old.raid_id
     or new.species <> old.species or new.started_at <> old.started_at
     or new.limits <> old.limits then
    raise exception 'only the outcome of a battle may change';
  end if;
  return new;
end;
$$;

CREATE FUNCTION public.guard_gift_claim() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  -- Which gift, whose, and when are settled when the claim is written
  if new.gift_id <> old.gift_id
     or new.player <> old.player
     or new.claimed_at <> old.claimed_at then
    raise exception 'a gift claim keeps its gift, its player and its hour';
  end if;
  -- The backfill: nothing becomes the catch the gift turned into
  if old.catch_id is null then
    return new;
  end if;
  -- The release: a claim outlives the pokemon it handed over, so it
  -- keeps its shape and loses its pointer.
  --
  -- Only where the catch is really gone, which is what makes this the
  -- foreign key's own write rather than somebody unpicking a claim
  -- that still points at a living pokemon
  if new.catch_id is null
     and not exists (select 1 from caught where id = old.catch_id) then
    return new;
  end if;
  raise exception 'gift_claims only backfill catch_id once';
end;
$$;

CREATE FUNCTION public.guard_history() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  if tg_op = 'INSERT' then
    if new.owner is null and new.owner_name is null then
      raise exception 'caught_history rows must name an owner';
    end if;
    return new;
  end if;
  if new.owner is null and old.owner is not null
    and new.caught_id = old.caught_id
    and new.seq = old.seq
    and new.owner_name is not distinct from old.owner_name
    and new.acquired_at_local = old.acquired_at_local
    and new.acquired_at_offset = old.acquired_at_offset
    and new.kind = old.kind
    and new.paid is not distinct from old.paid
    and new.ball is not distinct from old.ball
  then
    return new;
  end if;
  raise exception '% rows are write-once', tg_table_name;
end;
$$;

CREATE FUNCTION public.notify_change() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
declare
  payload text;
begin
  payload := json_build_object(
    'table', tg_table_name,
    'op', tg_op,
    'new', case when tg_op = 'DELETE' then null else to_jsonb(new) end,
    'old', case when tg_op = 'INSERT' then null else to_jsonb(old) end
  )::text;
  if octet_length(payload) > 7900 then
    payload := json_build_object('table', tg_table_name, 'op', tg_op, 'new', null, 'old', null)::text;
  end if;
  perform pg_notify('live_changes', payload);
  return null;
end;
$$;

CREATE FUNCTION public.raise_caught_revision() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  new.revision := old.revision + 1;
  return new;
end;
$$;

CREATE FUNCTION public.raise_revision_from_children() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  if tg_op = 'DELETE' then
    update caught set revision = revision
      where id in (select distinct caught_id from gone);
  else
    update caught set revision = revision
      where id in (select distinct caught_id from arrived);
  end if;
  return null;
end;
$$;

CREATE TABLE public.action_paces (
    player uuid NOT NULL,
    action text NOT NULL,
    at bigint NOT NULL,
    tokens double precision NOT NULL,
    burst double precision NOT NULL,
    per_ms double precision NOT NULL
);

CREATE TABLE public.announcements (
    id bigint NOT NULL,
    message text NOT NULL,
    starts_at bigint DEFAULT ((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint NOT NULL,
    ends_at bigint NOT NULL,
    CONSTRAINT announcements_check CHECK ((ends_at > starts_at)),
    CONSTRAINT announcements_message_check CHECK (((length(message) >= 1) AND (length(message) <= 280)))
);

ALTER TABLE public.announcements ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.announcements_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE public.auction_sellers (
    player uuid NOT NULL,
    auction text NOT NULL,
    ends_at bigint NOT NULL
);

CREATE TABLE public.auctions (
    id text NOT NULL,
    seller uuid NOT NULL,
    lot smallint NOT NULL,
    item integer,
    caught_id text,
    starting_bid bigint NOT NULL,
    increment bigint NOT NULL,
    bid bigint DEFAULT 0 NOT NULL,
    bidder uuid,
    created_at bigint NOT NULL,
    ends_at bigint NOT NULL,
    utc_offset smallint NOT NULL,
    settled boolean DEFAULT false NOT NULL,
    CONSTRAINT auctions_check1 CHECK ((bidder IS DISTINCT FROM seller)),
    CONSTRAINT auctions_increment_check CHECK (((increment >= 1) AND (increment <= 1000000))),
    CONSTRAINT auctions_lot_check CHECK ((((lot = 0) AND (item IS NOT NULL) AND (caught_id IS NULL)) OR ((lot = 1) AND (item IS NULL) AND ((caught_id IS NOT NULL) OR settled)))),
    CONSTRAINT auctions_starting_bid_check CHECK (((starting_bid >= 1) AND (starting_bid <= 1000000)))
);

ALTER TABLE ONLY public.auctions REPLICA IDENTITY FULL;

CREATE TABLE public.awards (
    player uuid NOT NULL,
    award smallint NOT NULL,
    earned_at bigint NOT NULL,
    wins bigint DEFAULT 1 NOT NULL
);

CREATE TABLE public.bag_candies (
    player uuid NOT NULL,
    family integer NOT NULL,
    count integer NOT NULL,
    CONSTRAINT bag_candies_count_check CHECK ((count > 0))
);

CREATE TABLE public.bag_items (
    player uuid NOT NULL,
    item integer NOT NULL,
    count integer NOT NULL,
    CONSTRAINT bag_items_count_check CHECK ((count > 0))
);

CREATE TABLE public.battle_aftermaths (
    battle_id text NOT NULL,
    player uuid NOT NULL,
    settled_at bigint NOT NULL
);

CREATE TABLE public.battle_teams (
    battle_id text NOT NULL,
    "position" smallint NOT NULL,
    snapshot_id text NOT NULL,
    player uuid
);

ALTER TABLE ONLY public.battle_teams REPLICA IDENTITY FULL;

CREATE TABLE public.battles (
    id text NOT NULL,
    raid_id text,
    species integer NOT NULL,
    outcome smallint DEFAULT 0 NOT NULL,
    started_at bigint NOT NULL,
    limits integer NOT NULL,
    biome smallint DEFAULT 24 NOT NULL,
    weather smallint DEFAULT 0 NOT NULL,
    opponent text DEFAULT ''::text NOT NULL,
    opponent_sprite text DEFAULT ''::text NOT NULL,
    rules smallint DEFAULT 0 NOT NULL
);

COMMENT ON COLUMN public.battles.opponent IS 'Who an unowned side was, for the history; empty for raids and player fights';

COMMENT ON COLUMN public.battles.opponent_sprite IS 'The overworld charset they were wearing, under sprites/overworld';

COMMENT ON COLUMN public.battles.rules IS 'The Frontier house rule the fight was held under; 0 for an ordinary fight';

CREATE TABLE public.berry_claims (
    marker text NOT NULL,
    player uuid NOT NULL,
    item integer NOT NULL,
    amount integer NOT NULL,
    claimed_at bigint DEFAULT 0 NOT NULL,
    generation smallint NOT NULL
);

CREATE TABLE public.bids (
    player uuid NOT NULL,
    auction text NOT NULL,
    amount bigint NOT NULL,
    bid_at bigint NOT NULL,
    CONSTRAINT bids_amount_check CHECK ((amount > 0))
);

CREATE TABLE public.blocks (
    blocker uuid NOT NULL,
    blocked uuid NOT NULL,
    since bigint NOT NULL,
    CONSTRAINT blocks_check CHECK ((blocker <> blocked))
);

ALTER TABLE ONLY public.blocks REPLICA IDENTITY FULL;

CREATE TABLE public.cache_claim_items (
    marker text NOT NULL,
    player uuid NOT NULL,
    item integer NOT NULL,
    amount integer NOT NULL,
    generation smallint NOT NULL
);

CREATE TABLE public.cache_claims (
    marker text NOT NULL,
    player uuid NOT NULL,
    claimed_at bigint NOT NULL,
    generation smallint NOT NULL
);

CREATE TABLE public.caught (
    id text NOT NULL,
    owner uuid,
    type smallint NOT NULL,
    species integer NOT NULL,
    nickname text DEFAULT ''::text NOT NULL,
    level smallint NOT NULL,
    individual_value integer NOT NULL,
    trait_value integer NOT NULL,
    ivs integer NOT NULL,
    gender smallint NOT NULL,
    nature smallint NOT NULL,
    shiny boolean DEFAULT false NOT NULL,
    shadow boolean DEFAULT false NOT NULL,
    egg boolean DEFAULT false NOT NULL,
    favorite boolean DEFAULT false NOT NULL,
    guarded boolean DEFAULT false NOT NULL,
    traded boolean DEFAULT false NOT NULL,
    auctionable boolean DEFAULT false NOT NULL,
    slots smallint NOT NULL,
    locked_at bigint DEFAULT 0 NOT NULL,
    steps integer DEFAULT 0 NOT NULL,
    hatch_steps integer DEFAULT 0 NOT NULL,
    stepped_at bigint DEFAULT 0 NOT NULL,
    health integer NOT NULL,
    statuses smallint DEFAULT 0 NOT NULL,
    lair smallint,
    ball integer NOT NULL,
    caught_at_local timestamp without time zone NOT NULL,
    caught_at_offset smallint NOT NULL,
    locale text DEFAULT ''::text NOT NULL,
    ev_hp smallint DEFAULT 0 NOT NULL,
    ev_atk smallint DEFAULT 0 NOT NULL,
    ev_def smallint DEFAULT 0 NOT NULL,
    ev_spa smallint DEFAULT 0 NOT NULL,
    ev_spd smallint DEFAULT 0 NOT NULL,
    ev_spe smallint DEFAULT 0 NOT NULL,
    effort_bonus smallint DEFAULT 0 NOT NULL,
    walked integer DEFAULT 0 NOT NULL,
    friendship smallint NOT NULL,
    origin_timestamp bigint NOT NULL,
    origin_x integer NOT NULL,
    origin_y integer NOT NULL,
    origin_biome smallint NOT NULL,
    origin_place text,
    iv_hp smallint GENERATED ALWAYS AS (((ivs >> 0) & 31)) STORED,
    iv_atk smallint GENERATED ALWAYS AS (((ivs >> 5) & 31)) STORED,
    iv_def smallint GENERATED ALWAYS AS (((ivs >> 10) & 31)) STORED,
    iv_spa smallint GENERATED ALWAYS AS (((ivs >> 15) & 31)) STORED,
    iv_spd smallint GENERATED ALWAYS AS (((ivs >> 20) & 31)) STORED,
    iv_spe smallint GENERATED ALWAYS AS (((ivs >> 25) & 31)) STORED,
    iv_total smallint GENERATED ALWAYS AS ((((((((ivs >> 0) & 31) + ((ivs >> 5) & 31)) + ((ivs >> 10) & 31)) + ((ivs >> 15) & 31)) + ((ivs >> 20) & 31)) + ((ivs >> 25) & 31))) STORED,
    status_poisoned boolean GENERATED ALWAYS AS ((((statuses)::integer & 1) <> 0)) STORED,
    status_badly_poisoned boolean GENERATED ALWAYS AS ((((statuses)::integer & 2) <> 0)) STORED,
    status_sleeping boolean GENERATED ALWAYS AS ((((statuses)::integer & 4) <> 0)) STORED,
    status_paralyzed boolean GENERATED ALWAYS AS ((((statuses)::integer & 8) <> 0)) STORED,
    status_burned boolean GENERATED ALWAYS AS ((((statuses)::integer & 16) <> 0)) STORED,
    status_frozen boolean GENERATED ALWAYS AS ((((statuses)::integer & 32) <> 0)) STORED,
    hatch_left integer GENERATED ALWAYS AS (GREATEST((hatch_steps - steps), 0)) STORED,
    can_evolve boolean DEFAULT false NOT NULL,
    max_health integer DEFAULT 1 NOT NULL,
    hurt boolean GENERATED ALWAYS AS ((health < max_health)) STORED,
    hidden boolean DEFAULT false NOT NULL,
    fused_with text,
    revision integer DEFAULT 0 NOT NULL,
    released_by uuid,
    released_at bigint,
    released_candy integer,
    CONSTRAINT caught_friendship_check CHECK (((friendship >= 0) AND (friendship <= 255))),
    CONSTRAINT caught_health_check CHECK ((health >= 0)),
    CONSTRAINT caught_ivs_check CHECK (((ivs >= 0) AND (ivs <= 1073741823))),
    CONSTRAINT caught_level_check CHECK (((level >= 1) AND (level <= 100))),
    CONSTRAINT caught_nickname_charset CHECK ((nickname ~ '^[[:alpha:][:digit:] ''.♀♂-]{0,24}$'::text)),
    CONSTRAINT caught_slots_check CHECK (((slots >= 0) AND (slots <= 511))),
    CONSTRAINT caught_statuses_check CHECK (((statuses >= 0) AND (statuses <= 63)))
);

COMMENT ON COLUMN public.caught.can_evolve IS 'Whether a handover has already met the condition a trade evolution asks for';

COMMENT ON COLUMN public.caught.max_health IS 'The derived maximum health, stored so `hurt` can be a column';

COMMENT ON COLUMN public.caught.hurt IS 'Whether the pokemon is short of its maximum health';

COMMENT ON COLUMN public.caught.hidden IS 'Whether this is the pokemon folded into a base, and so not out in the world';

COMMENT ON COLUMN public.caught.fused_with IS 'The pokemon folded into this one, which is hidden for as long as it is in there';

CREATE TABLE public.caught_abilities (
    caught_id text NOT NULL,
    slot smallint NOT NULL,
    ability integer NOT NULL
);

CREATE TABLE public.caught_history (
    caught_id text NOT NULL,
    seq smallint NOT NULL,
    owner uuid,
    owner_name text,
    acquired_at_local timestamp without time zone NOT NULL,
    acquired_at_offset smallint NOT NULL,
    kind smallint NOT NULL,
    paid bigint,
    ball integer,
    CONSTRAINT caught_history_paid_check CHECK ((paid >= 0))
);

CREATE TABLE public.caught_items (
    caught_id text NOT NULL,
    slot smallint NOT NULL,
    item integer NOT NULL
);

CREATE TABLE public.caught_moves (
    caught_id text NOT NULL,
    slot smallint NOT NULL,
    move integer NOT NULL,
    points smallint DEFAULT 0 NOT NULL,
    CONSTRAINT caught_moves_points_check CHECK (((points >= 0) AND (points <= 3))),
    CONSTRAINT caught_moves_slot_check CHECK (((slot >= 0) AND (slot <= 6)))
);

CREATE TABLE public.duel_catches (
    duel_id text NOT NULL,
    player uuid NOT NULL,
    slot smallint NOT NULL,
    caught_id text NOT NULL,
    CONSTRAINT duel_catches_slot_check CHECK (((slot >= 0) AND (slot <= 5)))
);

ALTER TABLE ONLY public.duel_catches REPLICA IDENTITY FULL;

CREATE TABLE public.duel_invites (
    duel_id text NOT NULL,
    sender uuid NOT NULL,
    recipient uuid NOT NULL,
    role smallint NOT NULL,
    sent_at bigint NOT NULL,
    CONSTRAINT duel_invites_check CHECK ((sender <> recipient))
);

ALTER TABLE ONLY public.duel_invites REPLICA IDENTITY FULL;

CREATE TABLE public.duel_members (
    duel_id text NOT NULL,
    player uuid NOT NULL,
    role smallint NOT NULL,
    ready boolean DEFAULT false NOT NULL,
    joined_seq bigint NOT NULL
);

ALTER TABLE ONLY public.duel_members REPLICA IDENTITY FULL;

ALTER TABLE public.duel_members ALTER COLUMN joined_seq ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.duel_members_joined_seq_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE public.duels (
    id text NOT NULL,
    host uuid NOT NULL,
    battle_id text,
    created_at bigint NOT NULL,
    limits integer NOT NULL,
    team_size smallint NOT NULL,
    CONSTRAINT duels_limits_range CHECK (((limits >= 0) AND (limits <= 511))),
    CONSTRAINT duels_team_size_range CHECK (((team_size >= 1) AND (team_size <= 6)))
);

ALTER TABLE ONLY public.duels REPLICA IDENTITY FULL;

CREATE TABLE public.encounter_abilities (
    spawn_id text NOT NULL,
    player uuid NOT NULL,
    slot smallint NOT NULL,
    ability integer NOT NULL,
    generation smallint NOT NULL
);

CREATE TABLE public.encounter_items (
    spawn_id text NOT NULL,
    player uuid NOT NULL,
    slot smallint NOT NULL,
    item integer NOT NULL,
    generation smallint NOT NULL
);

CREATE TABLE public.encounter_moves (
    spawn_id text NOT NULL,
    player uuid NOT NULL,
    slot smallint NOT NULL,
    move integer NOT NULL,
    generation smallint NOT NULL
);

CREATE TABLE public.encounters (
    spawn_id text NOT NULL,
    player uuid NOT NULL,
    type smallint NOT NULL,
    species integer NOT NULL,
    level smallint NOT NULL,
    individual_value integer NOT NULL,
    trait_value integer NOT NULL,
    ivs integer NOT NULL,
    lair smallint,
    nature smallint NOT NULL,
    ability integer NOT NULL,
    gender smallint NOT NULL,
    shiny boolean NOT NULL,
    shadow boolean NOT NULL,
    window_at bigint NOT NULL,
    x integer NOT NULL,
    y integer NOT NULL,
    biome smallint NOT NULL,
    place text,
    slots smallint,
    fed integer,
    generation smallint NOT NULL,
    safari jsonb
);

CREATE TABLE public.fled_encounters (
    player uuid NOT NULL,
    key text NOT NULL,
    window_at bigint NOT NULL,
    generation smallint NOT NULL
);

CREATE TABLE public.friend_codes (
    player uuid NOT NULL,
    code text NOT NULL
);

CREATE TABLE public.friend_requests (
    sender uuid NOT NULL,
    recipient uuid NOT NULL,
    sent_at bigint NOT NULL,
    CONSTRAINT friend_requests_check CHECK ((sender <> recipient))
);

ALTER TABLE ONLY public.friend_requests REPLICA IDENTITY FULL;

CREATE TABLE public.friends (
    owner uuid NOT NULL,
    friend uuid NOT NULL,
    since bigint NOT NULL,
    CONSTRAINT friends_check CHECK ((owner <> friend))
);

ALTER TABLE ONLY public.friends REPLICA IDENTITY FULL;

CREATE TABLE public.gift_claims (
    gift_id text NOT NULL,
    player uuid NOT NULL,
    claimed_at bigint NOT NULL,
    catch_id text
);

CREATE TABLE public.gifts (
    id text NOT NULL,
    player uuid,
    offered_at bigint NOT NULL,
    gift jsonb NOT NULL,
    encounter jsonb,
    CONSTRAINT gifts_encounter_check CHECK (((encounter IS NULL) OR (jsonb_typeof(encounter) = 'object'::text))),
    CONSTRAINT gifts_gift_check CHECK ((jsonb_typeof(gift) = 'object'::text))
);

CREATE TABLE public.gym_challenges (
    seat_id text NOT NULL,
    challenger uuid NOT NULL,
    battle_id text NOT NULL,
    held_by uuid NOT NULL,
    started_at bigint NOT NULL,
    settled boolean DEFAULT false NOT NULL,
    settled_at bigint DEFAULT 0 NOT NULL,
    window_at bigint DEFAULT 0 NOT NULL,
    taken integer DEFAULT 0 NOT NULL,
    generation smallint NOT NULL
);

CREATE TABLE public.gym_seats (
    seat_id text NOT NULL,
    holder uuid,
    snapshot_id text,
    chunk_seed text NOT NULL,
    chunk_x integer NOT NULL,
    chunk_y integer NOT NULL,
    cell integer NOT NULL,
    seated_at bigint NOT NULL,
    defenses integer DEFAULT 0 NOT NULL,
    ousted uuid,
    freed_at bigint DEFAULT 0 NOT NULL,
    generation smallint NOT NULL
);

ALTER TABLE ONLY public.gym_seats REPLICA IDENTITY FULL;

CREATE TABLE public.identities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    account_id text NOT NULL,
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    access_token text,
    refresh_token text,
    id_token text,
    access_token_expires_at timestamp with time zone,
    refresh_token_expires_at timestamp with time zone,
    scope text,
    password text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

CREATE TABLE public.jwks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    public_key text NOT NULL,
    private_key text NOT NULL,
    created_at timestamp with time zone NOT NULL,
    expires_at timestamp with time zone,
    alg text,
    crv text
);

CREATE TABLE public.ledger (
    id bigint NOT NULL,
    player uuid NOT NULL,
    kind smallint NOT NULL,
    key integer NOT NULL,
    delta bigint NOT NULL,
    balance bigint NOT NULL,
    reason text,
    tx bigint DEFAULT txid_current() NOT NULL,
    at bigint DEFAULT ((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint NOT NULL,
    CONSTRAINT ledger_kind_check CHECK (((kind >= 0) AND (kind <= 2)))
);

ALTER TABLE public.ledger ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.ledger_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE public.nest_claims (
    marker text NOT NULL,
    player uuid NOT NULL,
    species integer NOT NULL,
    claimed_at bigint DEFAULT 0 NOT NULL,
    generation smallint NOT NULL
);

CREATE TABLE public.npc_claims (
    marker text NOT NULL,
    player uuid NOT NULL,
    payload jsonb,
    claimed_at bigint DEFAULT 0 NOT NULL,
    generation smallint NOT NULL
);

CREATE TABLE public.phenomenon_claims (
    marker text NOT NULL,
    player uuid NOT NULL,
    kind smallint NOT NULL,
    claimed_at bigint DEFAULT 0 NOT NULL,
    generation smallint NOT NULL
);

CREATE TABLE public.pokedex_entries (
    player uuid NOT NULL,
    species integer NOT NULL,
    seen integer DEFAULT 0 NOT NULL,
    seen_shiny integer DEFAULT 0 NOT NULL,
    caught integer DEFAULT 0 NOT NULL,
    caught_shiny integer DEFAULT 0 NOT NULL,
    CONSTRAINT pokedex_entries_caught_check CHECK ((caught >= 0)),
    CONSTRAINT pokedex_entries_caught_shiny_check CHECK ((caught_shiny >= 0)),
    CONSTRAINT pokedex_entries_seen_check CHECK ((seen >= 0)),
    CONSTRAINT pokedex_entries_seen_shiny_check CHECK ((seen_shiny >= 0))
);

CREATE TABLE public.positions (
    player uuid NOT NULL,
    chunk_x integer NOT NULL,
    chunk_y integer NOT NULL,
    cell_x smallint NOT NULL,
    cell_y smallint NOT NULL,
    moved_at bigint NOT NULL,
    depth smallint DEFAULT 0 NOT NULL,
    generation smallint NOT NULL
);

COMMENT ON COLUMN public.positions.depth IS 'Which layer the player is on: 0 the surface, 1 the caves';

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    nickname text DEFAULT 'Trainer'::text NOT NULL,
    gold bigint DEFAULT 0 NOT NULL,
    role text DEFAULT ''::text NOT NULL,
    banned boolean DEFAULT false NOT NULL,
    ban_reason text DEFAULT ''::text NOT NULL,
    buddy_id text,
    title smallint,
    sprite text DEFAULT 'characters/frlg/red'::text NOT NULL,
    CONSTRAINT profiles_gold_check CHECK ((gold >= 0)),
    CONSTRAINT profiles_nickname_charset CHECK ((nickname ~ '^[[:alpha:][:digit:] ''.♀♂-]{1,24}$'::text))
);

CREATE TABLE public.quest_baselines (
    player uuid NOT NULL,
    quest integer NOT NULL,
    slot smallint NOT NULL,
    baseline bigint DEFAULT 0 NOT NULL
);

CREATE TABLE public.quest_claims (
    player uuid NOT NULL,
    quest integer NOT NULL,
    claimed_at bigint NOT NULL
);

CREATE TABLE public.quest_progress (
    player uuid NOT NULL,
    metric smallint NOT NULL,
    param integer DEFAULT 0 NOT NULL,
    count bigint DEFAULT 0 NOT NULL
);

CREATE TABLE public.raid_invites (
    raid_id text NOT NULL,
    sender uuid NOT NULL,
    recipient uuid NOT NULL,
    sent_at bigint NOT NULL,
    role smallint DEFAULT 0 NOT NULL,
    CONSTRAINT raid_invites_check CHECK ((sender <> recipient))
);

ALTER TABLE ONLY public.raid_invites REPLICA IDENTITY FULL;

CREATE TABLE public.raid_rewards (
    raid_id text NOT NULL,
    player uuid NOT NULL,
    gold integer NOT NULL
);

CREATE TABLE public.raid_watchers (
    raid_id text NOT NULL,
    player uuid NOT NULL,
    seen_at bigint NOT NULL
);

ALTER TABLE ONLY public.raid_watchers REPLICA IDENTITY FULL;

CREATE TABLE public.raids (
    id text NOT NULL,
    kind smallint NOT NULL,
    lair smallint,
    species integer NOT NULL,
    trait_value integer NOT NULL,
    host uuid NOT NULL,
    battle_id text,
    window_at bigint NOT NULL,
    utc_offset smallint NOT NULL,
    chunk_seed text NOT NULL,
    chunk_x integer NOT NULL,
    chunk_y integer NOT NULL,
    biome smallint NOT NULL,
    cell integer NOT NULL,
    cleared boolean DEFAULT false NOT NULL,
    generation smallint NOT NULL
);

ALTER TABLE ONLY public.raids REPLICA IDENTITY FULL;

CREATE TABLE public.rocket_party (
    stop_id text NOT NULL,
    player uuid NOT NULL,
    slot smallint NOT NULL,
    species integer NOT NULL,
    individual_value integer NOT NULL,
    trait_value integer NOT NULL,
    generation smallint NOT NULL,
    CONSTRAINT rocket_party_slot_check CHECK (((slot >= 0) AND (slot <= 5)))
);

CREATE TABLE public.rocket_stops (
    stop_id text NOT NULL,
    player uuid NOT NULL,
    battle_id text,
    window_at bigint NOT NULL,
    utc_offset smallint NOT NULL,
    chunk_seed text NOT NULL,
    chunk_x integer NOT NULL,
    chunk_y integer NOT NULL,
    cell integer NOT NULL,
    defeated boolean DEFAULT false NOT NULL,
    generation smallint NOT NULL
);

CREATE TABLE public.rotation_baselines (
    player uuid NOT NULL,
    window_key text NOT NULL,
    slot smallint NOT NULL,
    baseline bigint DEFAULT 0 NOT NULL
);

CREATE TABLE public.rotation_claims (
    player uuid NOT NULL,
    window_key text NOT NULL,
    slot smallint NOT NULL,
    claimed_at bigint NOT NULL
);

CREATE TABLE public.sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    token text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    ip_address text,
    user_agent text,
    user_id uuid NOT NULL
);

CREATE TABLE public.snapshot_spawns (
    chunk_seed text NOT NULL,
    zone text NOT NULL,
    idx smallint NOT NULL,
    species integer NOT NULL,
    individual_value integer NOT NULL,
    trait_value integer NOT NULL,
    generation smallint NOT NULL
);

CREATE TABLE public.snapshots (
    chunk_seed text NOT NULL,
    zone text NOT NULL,
    utc_offset smallint NOT NULL,
    window_at bigint NOT NULL,
    generation smallint NOT NULL
);

CREATE TABLE public.staff_actions (
    id bigint NOT NULL,
    actor uuid NOT NULL,
    action text NOT NULL,
    target uuid,
    detail jsonb DEFAULT '{}'::jsonb NOT NULL,
    at bigint NOT NULL
);

ALTER TABLE public.staff_actions ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.staff_actions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE public.switches (
    feature text NOT NULL,
    closed boolean DEFAULT false NOT NULL,
    message text DEFAULT ''::text NOT NULL
);

CREATE TABLE public.team_catches (
    team_id text NOT NULL,
    slot smallint NOT NULL,
    caught_id text NOT NULL,
    CONSTRAINT team_catches_slot_check CHECK (((slot >= 0) AND (slot <= 5)))
);

CREATE TABLE public.team_preset_catches (
    preset_id text NOT NULL,
    slot smallint NOT NULL,
    caught_id text NOT NULL,
    CONSTRAINT team_preset_catches_slot_check CHECK (((slot >= 0) AND (slot <= 5)))
);

CREATE TABLE public.team_presets (
    id text NOT NULL,
    player uuid NOT NULL,
    name text NOT NULL,
    made_at bigint NOT NULL
);

COMMENT ON TABLE public.team_presets IS 'Parties a player saved for themselves, loaded when a fight asks for a team';

CREATE TABLE public.team_snapshots (
    id text NOT NULL,
    player uuid,
    alliance smallint NOT NULL,
    catches jsonb NOT NULL,
    created_at bigint DEFAULT ((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint NOT NULL,
    CONSTRAINT team_snapshots_catches_check CHECK ((jsonb_typeof(catches) = 'array'::text))
);

CREATE TABLE public.teams (
    id text NOT NULL,
    player uuid NOT NULL,
    raid_id text NOT NULL,
    joined_seq bigint NOT NULL
);

ALTER TABLE ONLY public.teams REPLICA IDENTITY FULL;

ALTER TABLE public.teams ALTER COLUMN joined_seq ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.teams_joined_seq_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE public.towns (
    region_x integer NOT NULL,
    region_y integer NOT NULL,
    found_by uuid,
    found_at bigint NOT NULL,
    generation smallint NOT NULL
);

COMMENT ON TABLE public.towns IS 'Regions somebody has walked a town in; the name is derived, never stored';

CREATE TABLE public.trades (
    id text NOT NULL,
    proposer uuid NOT NULL,
    receiver uuid NOT NULL,
    offered_caught text,
    asked_caught text,
    given_caught text,
    gold bigint DEFAULT 0 NOT NULL,
    status smallint DEFAULT 0 NOT NULL,
    created_at bigint NOT NULL,
    resolved_at bigint,
    utc_offset smallint NOT NULL,
    CONSTRAINT trades_check CHECK ((proposer <> receiver)),
    CONSTRAINT trades_gold_check CHECK (((gold >= '-1000000'::integer) AND (gold <= 1000000)))
);

ALTER TABLE ONLY public.trades REPLICA IDENTITY FULL;

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    email_verified boolean NOT NULL,
    image text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE public.verifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    identifier text NOT NULL,
    value text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE ONLY public.action_paces
    ADD CONSTRAINT action_paces_pkey PRIMARY KEY (player, action);

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.auction_sellers
    ADD CONSTRAINT auction_sellers_pkey PRIMARY KEY (player);

ALTER TABLE ONLY public.auctions
    ADD CONSTRAINT auctions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.awards
    ADD CONSTRAINT awards_pkey PRIMARY KEY (player, award);

ALTER TABLE ONLY public.bag_candies
    ADD CONSTRAINT bag_candies_pkey PRIMARY KEY (player, family);

ALTER TABLE ONLY public.bag_items
    ADD CONSTRAINT bag_items_pkey PRIMARY KEY (player, item);

ALTER TABLE ONLY public.battle_aftermaths
    ADD CONSTRAINT battle_aftermaths_pkey PRIMARY KEY (battle_id, player);

ALTER TABLE ONLY public.battle_teams
    ADD CONSTRAINT battle_teams_pkey PRIMARY KEY (battle_id, "position");

ALTER TABLE ONLY public.battles
    ADD CONSTRAINT battles_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.berry_claims
    ADD CONSTRAINT berry_claims_pkey PRIMARY KEY (generation, marker, player);

ALTER TABLE ONLY public.bids
    ADD CONSTRAINT bids_pkey PRIMARY KEY (player, auction);

ALTER TABLE ONLY public.blocks
    ADD CONSTRAINT blocks_pkey PRIMARY KEY (blocker, blocked);

ALTER TABLE ONLY public.cache_claim_items
    ADD CONSTRAINT cache_claim_items_pkey PRIMARY KEY (generation, marker, player, item);

ALTER TABLE ONLY public.cache_claims
    ADD CONSTRAINT cache_claims_pkey PRIMARY KEY (generation, marker, player);

ALTER TABLE ONLY public.caught_abilities
    ADD CONSTRAINT caught_abilities_caught_id_ability_key UNIQUE (caught_id, ability);

ALTER TABLE ONLY public.caught_abilities
    ADD CONSTRAINT caught_abilities_pkey PRIMARY KEY (caught_id, slot);

ALTER TABLE ONLY public.caught_history
    ADD CONSTRAINT caught_history_pkey PRIMARY KEY (caught_id, seq);

ALTER TABLE ONLY public.caught_items
    ADD CONSTRAINT caught_items_pkey PRIMARY KEY (caught_id, slot);

ALTER TABLE ONLY public.caught_moves
    ADD CONSTRAINT caught_moves_caught_id_move_key UNIQUE (caught_id, move);

ALTER TABLE ONLY public.caught_moves
    ADD CONSTRAINT caught_moves_pkey PRIMARY KEY (caught_id, slot);

ALTER TABLE ONLY public.caught
    ADD CONSTRAINT caught_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.duel_catches
    ADD CONSTRAINT duel_catches_duel_id_player_caught_id_key UNIQUE (duel_id, player, caught_id);

ALTER TABLE ONLY public.duel_catches
    ADD CONSTRAINT duel_catches_pkey PRIMARY KEY (duel_id, player, slot);

ALTER TABLE ONLY public.duel_invites
    ADD CONSTRAINT duel_invites_pkey PRIMARY KEY (duel_id, recipient);

ALTER TABLE ONLY public.duel_members
    ADD CONSTRAINT duel_members_pkey PRIMARY KEY (duel_id, player);

ALTER TABLE ONLY public.duels
    ADD CONSTRAINT duels_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.encounter_abilities
    ADD CONSTRAINT encounter_abilities_pkey PRIMARY KEY (generation, spawn_id, player, slot);

ALTER TABLE ONLY public.encounter_items
    ADD CONSTRAINT encounter_items_pkey PRIMARY KEY (generation, spawn_id, player, slot);

ALTER TABLE ONLY public.encounter_moves
    ADD CONSTRAINT encounter_moves_pkey PRIMARY KEY (generation, spawn_id, player, slot);

ALTER TABLE ONLY public.encounters
    ADD CONSTRAINT encounters_pkey PRIMARY KEY (generation, spawn_id, player);

ALTER TABLE ONLY public.fled_encounters
    ADD CONSTRAINT fled_encounters_pkey PRIMARY KEY (player, generation, key);

ALTER TABLE ONLY public.friend_codes
    ADD CONSTRAINT friend_codes_code_key UNIQUE (code);

ALTER TABLE ONLY public.friend_codes
    ADD CONSTRAINT friend_codes_pkey PRIMARY KEY (player);

ALTER TABLE ONLY public.friend_requests
    ADD CONSTRAINT friend_requests_pkey PRIMARY KEY (sender, recipient);

ALTER TABLE ONLY public.friends
    ADD CONSTRAINT friends_pkey PRIMARY KEY (owner, friend);

ALTER TABLE ONLY public.gift_claims
    ADD CONSTRAINT gift_claims_pkey PRIMARY KEY (gift_id, player);

ALTER TABLE ONLY public.gifts
    ADD CONSTRAINT gifts_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.gym_challenges
    ADD CONSTRAINT gym_challenges_pkey PRIMARY KEY (generation, seat_id, challenger);

ALTER TABLE ONLY public.gym_seats
    ADD CONSTRAINT gym_seats_pkey PRIMARY KEY (generation, seat_id);

ALTER TABLE ONLY public.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.jwks
    ADD CONSTRAINT jwks_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.ledger
    ADD CONSTRAINT ledger_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.nest_claims
    ADD CONSTRAINT nest_claims_pkey PRIMARY KEY (generation, marker, player);

ALTER TABLE ONLY public.npc_claims
    ADD CONSTRAINT npc_claims_pkey PRIMARY KEY (generation, marker, player);

ALTER TABLE ONLY public.phenomenon_claims
    ADD CONSTRAINT phenomenon_claims_pkey PRIMARY KEY (generation, marker, player);

ALTER TABLE ONLY public.pokedex_entries
    ADD CONSTRAINT pokedex_entries_pkey PRIMARY KEY (player, species);

ALTER TABLE ONLY public.positions
    ADD CONSTRAINT positions_pkey PRIMARY KEY (player, generation);

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.quest_baselines
    ADD CONSTRAINT quest_baselines_pkey PRIMARY KEY (player, quest, slot);

ALTER TABLE ONLY public.quest_claims
    ADD CONSTRAINT quest_claims_pkey PRIMARY KEY (player, quest);

ALTER TABLE ONLY public.quest_progress
    ADD CONSTRAINT quest_progress_pkey PRIMARY KEY (player, metric, param);

ALTER TABLE ONLY public.raid_invites
    ADD CONSTRAINT raid_invites_pkey PRIMARY KEY (raid_id, recipient);

ALTER TABLE ONLY public.raid_rewards
    ADD CONSTRAINT raid_rewards_pkey PRIMARY KEY (raid_id, player);

ALTER TABLE ONLY public.raid_watchers
    ADD CONSTRAINT raid_watchers_pkey PRIMARY KEY (raid_id, player);

ALTER TABLE ONLY public.raids
    ADD CONSTRAINT raids_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.rocket_party
    ADD CONSTRAINT rocket_party_pkey PRIMARY KEY (generation, stop_id, player, slot);

ALTER TABLE ONLY public.rocket_stops
    ADD CONSTRAINT rocket_stops_pkey PRIMARY KEY (generation, stop_id, player);

ALTER TABLE ONLY public.rotation_baselines
    ADD CONSTRAINT rotation_baselines_pkey PRIMARY KEY (player, window_key, slot);

ALTER TABLE ONLY public.rotation_claims
    ADD CONSTRAINT rotation_claims_pkey PRIMARY KEY (player, window_key, slot);

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_token_key UNIQUE (token);

ALTER TABLE ONLY public.snapshot_spawns
    ADD CONSTRAINT snapshot_spawns_pkey PRIMARY KEY (generation, chunk_seed, zone, idx);

ALTER TABLE ONLY public.snapshots
    ADD CONSTRAINT snapshots_pkey PRIMARY KEY (generation, chunk_seed, zone);

ALTER TABLE ONLY public.staff_actions
    ADD CONSTRAINT staff_actions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.switches
    ADD CONSTRAINT switches_pkey PRIMARY KEY (feature);

ALTER TABLE ONLY public.team_catches
    ADD CONSTRAINT team_catches_pkey PRIMARY KEY (team_id, slot);

ALTER TABLE ONLY public.team_catches
    ADD CONSTRAINT team_catches_team_id_caught_id_key UNIQUE (team_id, caught_id);

ALTER TABLE ONLY public.team_preset_catches
    ADD CONSTRAINT team_preset_catches_pkey PRIMARY KEY (preset_id, slot);

ALTER TABLE ONLY public.team_preset_catches
    ADD CONSTRAINT team_preset_catches_preset_id_caught_id_key UNIQUE (preset_id, caught_id);

ALTER TABLE ONLY public.team_presets
    ADD CONSTRAINT team_presets_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.team_snapshots
    ADD CONSTRAINT team_snapshots_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.towns
    ADD CONSTRAINT towns_pkey PRIMARY KEY (generation, region_x, region_y);

ALTER TABLE ONLY public.trades
    ADD CONSTRAINT trades_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.verifications
    ADD CONSTRAINT verifications_pkey PRIMARY KEY (id);

CREATE INDEX auctions_live ON public.auctions USING btree (ends_at) WHERE (NOT settled);

CREATE INDEX auctions_seller ON public.auctions USING btree (seller);

CREATE INDEX battle_teams_player ON public.battle_teams USING btree (player) WHERE (player IS NOT NULL);

CREATE INDEX battle_teams_snapshot ON public.battle_teams USING btree (snapshot_id);

CREATE INDEX battles_swept ON public.battles USING btree (started_at);

CREATE INDEX berry_claims_swept ON public.berry_claims USING btree (claimed_at);

CREATE INDEX cache_claims_swept ON public.cache_claims USING btree (claimed_at);

CREATE INDEX caught_abilities_ability ON public.caught_abilities USING btree (ability);

CREATE INDEX caught_history_owner_name ON public.caught_history USING btree (owner_name) WHERE (owner_name IS NOT NULL);

CREATE INDEX caught_items_item ON public.caught_items USING btree (item);

CREATE INDEX caught_moves_move ON public.caught_moves USING btree (move);

CREATE INDEX caught_nickname_trgm ON public.caught USING gin (nickname public.gin_trgm_ops) WHERE (nickname <> ''::text);

CREATE INDEX caught_owner ON public.caught USING btree (owner) WHERE (owner IS NOT NULL);

CREATE INDEX caught_owner_caught_at ON public.caught USING btree (owner, caught_at_local);

CREATE INDEX caught_owner_friendship ON public.caught USING btree (owner, friendship);

CREATE INDEX caught_owner_iv_total ON public.caught USING btree (owner, iv_total);

CREATE INDEX caught_owner_level ON public.caught USING btree (owner, level);

CREATE INDEX caught_owner_species ON public.caught USING btree (owner, species);

CREATE INDEX caught_place_trgm ON public.caught USING gin (origin_place public.gin_trgm_ops) WHERE (origin_place IS NOT NULL);

CREATE INDEX caught_released ON public.caught USING btree (released_by, released_at) WHERE (released_by IS NOT NULL);

CREATE INDEX duel_catches_caught ON public.duel_catches USING btree (caught_id);

CREATE INDEX duel_invites_recipient ON public.duel_invites USING btree (recipient);

CREATE INDEX duel_members_player ON public.duel_members USING btree (player);

CREATE INDEX duels_host ON public.duels USING btree (host);

CREATE INDEX duels_swept ON public.duels USING btree (created_at);

CREATE INDEX encounters_swept ON public.encounters USING btree (window_at) WHERE (type = 0);

CREATE INDEX fled_window ON public.fled_encounters USING btree (window_at);

CREATE INDEX friend_requests_recipient ON public.friend_requests USING btree (recipient);

CREATE INDEX gift_claims_player ON public.gift_claims USING btree (player);

CREATE INDEX gifts_player ON public.gifts USING btree (player) WHERE (player IS NOT NULL);

CREATE INDEX gym_challenges_battle ON public.gym_challenges USING btree (battle_id);

CREATE INDEX gym_seats_holder ON public.gym_seats USING btree (holder);

CREATE INDEX gym_seats_snapshot ON public.gym_seats USING btree (snapshot_id) WHERE (snapshot_id IS NOT NULL);

CREATE INDEX identities_user_id_idx ON public.identities USING btree (user_id);

CREATE INDEX ledger_player ON public.ledger USING btree (player, at DESC);

CREATE INDEX ledger_tx ON public.ledger USING btree (tx);

CREATE INDEX nest_claims_swept ON public.nest_claims USING btree (claimed_at);

CREATE INDEX npc_claims_swept ON public.npc_claims USING btree (claimed_at);

CREATE INDEX phenomenon_claims_swept ON public.phenomenon_claims USING btree (claimed_at);

CREATE INDEX profiles_buddy ON public.profiles USING btree (buddy_id) WHERE (buddy_id IS NOT NULL);

CREATE INDEX raid_invites_recipient ON public.raid_invites USING btree (recipient);

CREATE INDEX raid_watchers_player ON public.raid_watchers USING btree (player);

CREATE INDEX raids_generation ON public.raids USING btree (generation, window_at);

CREATE INDEX raids_window ON public.raids USING btree (window_at, utc_offset);

CREATE INDEX rocket_stops_swept ON public.rocket_stops USING btree (window_at);

CREATE INDEX sessions_user_id_idx ON public.sessions USING btree (user_id);

CREATE INDEX snapshots_swept ON public.snapshots USING btree (window_at);

CREATE INDEX staff_actions_at ON public.staff_actions USING btree (at DESC);

CREATE INDEX staff_actions_target ON public.staff_actions USING btree (target, at DESC) WHERE (target IS NOT NULL);

CREATE INDEX team_catches_caught ON public.team_catches USING btree (caught_id);

CREATE INDEX team_preset_catches_caught ON public.team_preset_catches USING btree (caught_id);

CREATE INDEX team_preset_catches_preset ON public.team_preset_catches USING btree (preset_id);

CREATE INDEX team_presets_player ON public.team_presets USING btree (player);

CREATE INDEX team_snapshots_swept ON public.team_snapshots USING btree (created_at);

CREATE INDEX teams_player ON public.teams USING btree (player);

CREATE INDEX teams_raid ON public.teams USING btree (raid_id);

CREATE UNIQUE INDEX trades_open_pair ON public.trades USING btree (proposer, receiver) WHERE (status = 0);

CREATE INDEX trades_proposer ON public.trades USING btree (proposer);

CREATE INDEX trades_receiver ON public.trades USING btree (receiver);

CREATE INDEX verifications_identifier_idx ON public.verifications USING btree (identifier);

CREATE TRIGGER append_only BEFORE INSERT OR UPDATE ON public.caught_history FOR EACH ROW EXECUTE FUNCTION public.guard_history();

CREATE TRIGGER backfill_only BEFORE UPDATE ON public.gift_claims FOR EACH ROW EXECUTE FUNCTION public.guard_gift_claim();

CREATE TRIGGER buddy_follows_owner AFTER UPDATE OF owner ON public.caught FOR EACH ROW EXECUTE FUNCTION public.clear_stale_buddy();

CREATE TRIGGER buddy_owner BEFORE INSERT OR UPDATE OF buddy_id ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.check_buddy_owner();

CREATE TRIGGER dex_monotonic BEFORE UPDATE ON public.pokedex_entries FOR EACH ROW EXECUTE FUNCTION public.check_dex_monotonic();

CREATE TRIGGER live_changes AFTER INSERT OR DELETE OR UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.notify_change();

CREATE TRIGGER live_changes AFTER INSERT OR DELETE OR UPDATE ON public.auctions FOR EACH ROW EXECUTE FUNCTION public.notify_change();

CREATE TRIGGER live_changes AFTER INSERT OR DELETE OR UPDATE ON public.bag_candies FOR EACH ROW EXECUTE FUNCTION public.notify_change();

CREATE TRIGGER live_changes AFTER INSERT OR DELETE OR UPDATE ON public.bag_items FOR EACH ROW EXECUTE FUNCTION public.notify_change();

CREATE TRIGGER live_changes AFTER INSERT OR DELETE OR UPDATE ON public.battle_teams FOR EACH ROW EXECUTE FUNCTION public.notify_change();

CREATE TRIGGER live_changes AFTER INSERT OR DELETE OR UPDATE ON public.battles FOR EACH ROW EXECUTE FUNCTION public.notify_change();

CREATE TRIGGER live_changes AFTER INSERT OR DELETE OR UPDATE ON public.blocks FOR EACH ROW EXECUTE FUNCTION public.notify_change();

CREATE TRIGGER live_changes AFTER INSERT OR DELETE OR UPDATE ON public.duel_catches FOR EACH ROW EXECUTE FUNCTION public.notify_change();

CREATE TRIGGER live_changes AFTER INSERT OR DELETE OR UPDATE ON public.duel_invites FOR EACH ROW EXECUTE FUNCTION public.notify_change();

CREATE TRIGGER live_changes AFTER INSERT OR DELETE OR UPDATE ON public.duel_members FOR EACH ROW EXECUTE FUNCTION public.notify_change();

CREATE TRIGGER live_changes AFTER INSERT OR DELETE OR UPDATE ON public.duels FOR EACH ROW EXECUTE FUNCTION public.notify_change();

CREATE TRIGGER live_changes AFTER INSERT OR DELETE OR UPDATE ON public.friend_requests FOR EACH ROW EXECUTE FUNCTION public.notify_change();

CREATE TRIGGER live_changes AFTER INSERT OR DELETE OR UPDATE ON public.friends FOR EACH ROW EXECUTE FUNCTION public.notify_change();

CREATE TRIGGER live_changes AFTER INSERT OR DELETE OR UPDATE ON public.positions FOR EACH ROW EXECUTE FUNCTION public.notify_change();

CREATE TRIGGER live_changes AFTER INSERT OR DELETE OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.notify_change();

CREATE TRIGGER live_changes AFTER INSERT OR DELETE OR UPDATE ON public.raid_invites FOR EACH ROW EXECUTE FUNCTION public.notify_change();

CREATE TRIGGER live_changes AFTER INSERT OR DELETE OR UPDATE ON public.raid_watchers FOR EACH ROW EXECUTE FUNCTION public.notify_change();

CREATE TRIGGER live_changes AFTER INSERT OR DELETE OR UPDATE ON public.raids FOR EACH ROW EXECUTE FUNCTION public.notify_change();

CREATE TRIGGER live_changes AFTER INSERT OR DELETE OR UPDATE ON public.snapshots FOR EACH ROW EXECUTE FUNCTION public.notify_change();

CREATE TRIGGER live_changes AFTER INSERT OR DELETE OR UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.notify_change();

CREATE TRIGGER live_changes AFTER INSERT OR DELETE OR UPDATE ON public.trades FOR EACH ROW EXECUTE FUNCTION public.notify_change();

CREATE TRIGGER raise_parent_on_delete AFTER DELETE ON public.caught_abilities REFERENCING OLD TABLE AS gone FOR EACH STATEMENT EXECUTE FUNCTION public.raise_revision_from_children();

CREATE TRIGGER raise_parent_on_delete AFTER DELETE ON public.caught_items REFERENCING OLD TABLE AS gone FOR EACH STATEMENT EXECUTE FUNCTION public.raise_revision_from_children();

CREATE TRIGGER raise_parent_on_delete AFTER DELETE ON public.caught_moves REFERENCING OLD TABLE AS gone FOR EACH STATEMENT EXECUTE FUNCTION public.raise_revision_from_children();

CREATE TRIGGER raise_parent_on_insert AFTER INSERT ON public.caught_abilities REFERENCING NEW TABLE AS arrived FOR EACH STATEMENT EXECUTE FUNCTION public.raise_revision_from_children();

CREATE TRIGGER raise_parent_on_insert AFTER INSERT ON public.caught_history REFERENCING NEW TABLE AS arrived FOR EACH STATEMENT EXECUTE FUNCTION public.raise_revision_from_children();

CREATE TRIGGER raise_parent_on_insert AFTER INSERT ON public.caught_items REFERENCING NEW TABLE AS arrived FOR EACH STATEMENT EXECUTE FUNCTION public.raise_revision_from_children();

CREATE TRIGGER raise_parent_on_insert AFTER INSERT ON public.caught_moves REFERENCING NEW TABLE AS arrived FOR EACH STATEMENT EXECUTE FUNCTION public.raise_revision_from_children();

CREATE TRIGGER raise_parent_on_update AFTER UPDATE ON public.caught_abilities REFERENCING NEW TABLE AS arrived FOR EACH STATEMENT EXECUTE FUNCTION public.raise_revision_from_children();

CREATE TRIGGER raise_parent_on_update AFTER UPDATE ON public.caught_items REFERENCING NEW TABLE AS arrived FOR EACH STATEMENT EXECUTE FUNCTION public.raise_revision_from_children();

CREATE TRIGGER raise_parent_on_update AFTER UPDATE ON public.caught_moves REFERENCING NEW TABLE AS arrived FOR EACH STATEMENT EXECUTE FUNCTION public.raise_revision_from_children();

CREATE TRIGGER raise_revision BEFORE UPDATE ON public.caught FOR EACH ROW EXECUTE FUNCTION public.raise_caught_revision();

CREATE TRIGGER settle_once BEFORE UPDATE ON public.battles FOR EACH ROW EXECUTE FUNCTION public.guard_battle_update();

CREATE TRIGGER write_once BEFORE UPDATE ON public.battle_aftermaths FOR EACH ROW EXECUTE FUNCTION public.forbid_change();

CREATE TRIGGER write_once BEFORE UPDATE ON public.berry_claims FOR EACH ROW EXECUTE FUNCTION public.forbid_change();

CREATE TRIGGER write_once BEFORE UPDATE ON public.cache_claim_items FOR EACH ROW EXECUTE FUNCTION public.forbid_change();

CREATE TRIGGER write_once BEFORE UPDATE ON public.cache_claims FOR EACH ROW EXECUTE FUNCTION public.forbid_change();

CREATE TRIGGER write_once BEFORE UPDATE ON public.nest_claims FOR EACH ROW EXECUTE FUNCTION public.forbid_change();

CREATE TRIGGER write_once BEFORE UPDATE ON public.phenomenon_claims FOR EACH ROW EXECUTE FUNCTION public.forbid_change();

CREATE TRIGGER write_once BEFORE UPDATE ON public.raid_rewards FOR EACH ROW EXECUTE FUNCTION public.forbid_change();

CREATE TRIGGER write_once BEFORE UPDATE ON public.team_snapshots FOR EACH ROW EXECUTE FUNCTION public.forbid_change();

ALTER TABLE ONLY public.action_paces
    ADD CONSTRAINT action_paces_player_fkey FOREIGN KEY (player) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.auction_sellers
    ADD CONSTRAINT auction_sellers_auction_fkey FOREIGN KEY (auction) REFERENCES public.auctions(id);

ALTER TABLE ONLY public.auction_sellers
    ADD CONSTRAINT auction_sellers_player_fkey FOREIGN KEY (player) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.auctions
    ADD CONSTRAINT auctions_bidder_fkey FOREIGN KEY (bidder) REFERENCES public.users(id);

ALTER TABLE ONLY public.auctions
    ADD CONSTRAINT auctions_caught_id_fkey FOREIGN KEY (caught_id) REFERENCES public.caught(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.auctions
    ADD CONSTRAINT auctions_seller_fkey FOREIGN KEY (seller) REFERENCES public.users(id);

ALTER TABLE ONLY public.awards
    ADD CONSTRAINT awards_player_fkey FOREIGN KEY (player) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.bag_candies
    ADD CONSTRAINT bag_candies_player_fkey FOREIGN KEY (player) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.bag_items
    ADD CONSTRAINT bag_items_player_fkey FOREIGN KEY (player) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.battle_aftermaths
    ADD CONSTRAINT battle_aftermaths_battle_id_fkey FOREIGN KEY (battle_id) REFERENCES public.battles(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.battle_aftermaths
    ADD CONSTRAINT battle_aftermaths_player_fkey FOREIGN KEY (player) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.battle_teams
    ADD CONSTRAINT battle_teams_battle_id_fkey FOREIGN KEY (battle_id) REFERENCES public.battles(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.battle_teams
    ADD CONSTRAINT battle_teams_player_fkey FOREIGN KEY (player) REFERENCES public.users(id);

ALTER TABLE ONLY public.battle_teams
    ADD CONSTRAINT battle_teams_snapshot_id_fkey FOREIGN KEY (snapshot_id) REFERENCES public.team_snapshots(id);

ALTER TABLE ONLY public.battles
    ADD CONSTRAINT battles_raid_id_fkey FOREIGN KEY (raid_id) REFERENCES public.raids(id);

ALTER TABLE ONLY public.berry_claims
    ADD CONSTRAINT berry_claims_player_fkey FOREIGN KEY (player) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.bids
    ADD CONSTRAINT bids_auction_fkey FOREIGN KEY (auction) REFERENCES public.auctions(id);

ALTER TABLE ONLY public.bids
    ADD CONSTRAINT bids_player_fkey FOREIGN KEY (player) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.blocks
    ADD CONSTRAINT blocks_blocked_fkey FOREIGN KEY (blocked) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.blocks
    ADD CONSTRAINT blocks_blocker_fkey FOREIGN KEY (blocker) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.cache_claim_items
    ADD CONSTRAINT cache_claim_items_generation_marker_player_fkey FOREIGN KEY (generation, marker, player) REFERENCES public.cache_claims(generation, marker, player) ON DELETE CASCADE;

ALTER TABLE ONLY public.cache_claims
    ADD CONSTRAINT cache_claims_player_fkey FOREIGN KEY (player) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.caught_abilities
    ADD CONSTRAINT caught_abilities_caught_id_fkey FOREIGN KEY (caught_id) REFERENCES public.caught(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.caught
    ADD CONSTRAINT caught_fused_with_fkey FOREIGN KEY (fused_with) REFERENCES public.caught(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.caught_history
    ADD CONSTRAINT caught_history_caught_id_fkey FOREIGN KEY (caught_id) REFERENCES public.caught(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.caught_history
    ADD CONSTRAINT caught_history_owner_fkey FOREIGN KEY (owner) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.caught_items
    ADD CONSTRAINT caught_items_caught_id_fkey FOREIGN KEY (caught_id) REFERENCES public.caught(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.caught_moves
    ADD CONSTRAINT caught_moves_caught_id_fkey FOREIGN KEY (caught_id) REFERENCES public.caught(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.caught
    ADD CONSTRAINT caught_owner_fkey FOREIGN KEY (owner) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.caught
    ADD CONSTRAINT caught_released_by_fkey FOREIGN KEY (released_by) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.duel_catches
    ADD CONSTRAINT duel_catches_caught_id_fkey FOREIGN KEY (caught_id) REFERENCES public.caught(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.duel_catches
    ADD CONSTRAINT duel_catches_duel_id_player_fkey FOREIGN KEY (duel_id, player) REFERENCES public.duel_members(duel_id, player) ON DELETE CASCADE;

ALTER TABLE ONLY public.duel_invites
    ADD CONSTRAINT duel_invites_duel_id_fkey FOREIGN KEY (duel_id) REFERENCES public.duels(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.duel_invites
    ADD CONSTRAINT duel_invites_recipient_fkey FOREIGN KEY (recipient) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.duel_invites
    ADD CONSTRAINT duel_invites_sender_fkey FOREIGN KEY (sender) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.duel_members
    ADD CONSTRAINT duel_members_duel_id_fkey FOREIGN KEY (duel_id) REFERENCES public.duels(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.duel_members
    ADD CONSTRAINT duel_members_player_fkey FOREIGN KEY (player) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.duels
    ADD CONSTRAINT duels_host_fkey FOREIGN KEY (host) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.encounter_abilities
    ADD CONSTRAINT encounter_abilities_generation_spawn_id_player_fkey FOREIGN KEY (generation, spawn_id, player) REFERENCES public.encounters(generation, spawn_id, player) ON DELETE CASCADE;

ALTER TABLE ONLY public.encounter_items
    ADD CONSTRAINT encounter_items_generation_spawn_id_player_fkey FOREIGN KEY (generation, spawn_id, player) REFERENCES public.encounters(generation, spawn_id, player) ON DELETE CASCADE;

ALTER TABLE ONLY public.encounter_moves
    ADD CONSTRAINT encounter_moves_generation_spawn_id_player_fkey FOREIGN KEY (generation, spawn_id, player) REFERENCES public.encounters(generation, spawn_id, player) ON DELETE CASCADE;

ALTER TABLE ONLY public.encounters
    ADD CONSTRAINT encounters_player_fkey FOREIGN KEY (player) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.fled_encounters
    ADD CONSTRAINT fled_encounters_player_fkey FOREIGN KEY (player) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.friend_codes
    ADD CONSTRAINT friend_codes_player_fkey FOREIGN KEY (player) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.friend_requests
    ADD CONSTRAINT friend_requests_recipient_fkey FOREIGN KEY (recipient) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.friend_requests
    ADD CONSTRAINT friend_requests_sender_fkey FOREIGN KEY (sender) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.friends
    ADD CONSTRAINT friends_friend_fkey FOREIGN KEY (friend) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.friends
    ADD CONSTRAINT friends_owner_fkey FOREIGN KEY (owner) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.gift_claims
    ADD CONSTRAINT gift_claims_catch_id_fkey FOREIGN KEY (catch_id) REFERENCES public.caught(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.gift_claims
    ADD CONSTRAINT gift_claims_gift_id_fkey FOREIGN KEY (gift_id) REFERENCES public.gifts(id);

ALTER TABLE ONLY public.gift_claims
    ADD CONSTRAINT gift_claims_player_fkey FOREIGN KEY (player) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.gifts
    ADD CONSTRAINT gifts_player_fkey FOREIGN KEY (player) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.gym_challenges
    ADD CONSTRAINT gym_challenges_battle_id_fkey FOREIGN KEY (battle_id) REFERENCES public.battles(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.gym_challenges
    ADD CONSTRAINT gym_challenges_challenger_fkey FOREIGN KEY (challenger) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.gym_challenges
    ADD CONSTRAINT gym_challenges_generation_seat_id_fkey FOREIGN KEY (generation, seat_id) REFERENCES public.gym_seats(generation, seat_id) ON DELETE CASCADE;

ALTER TABLE ONLY public.gym_challenges
    ADD CONSTRAINT gym_challenges_held_by_fkey FOREIGN KEY (held_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.gym_seats
    ADD CONSTRAINT gym_seats_holder_fkey FOREIGN KEY (holder) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.gym_seats
    ADD CONSTRAINT gym_seats_ousted_fkey FOREIGN KEY (ousted) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.gym_seats
    ADD CONSTRAINT gym_seats_snapshot_id_fkey FOREIGN KEY (snapshot_id) REFERENCES public.team_snapshots(id);

ALTER TABLE ONLY public.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.ledger
    ADD CONSTRAINT ledger_player_fkey FOREIGN KEY (player) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.nest_claims
    ADD CONSTRAINT nest_claims_player_fkey FOREIGN KEY (player) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.npc_claims
    ADD CONSTRAINT npc_claims_player_fkey FOREIGN KEY (player) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.phenomenon_claims
    ADD CONSTRAINT phenomenon_claims_player_fkey FOREIGN KEY (player) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.pokedex_entries
    ADD CONSTRAINT pokedex_entries_player_fkey FOREIGN KEY (player) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.positions
    ADD CONSTRAINT positions_player_fkey FOREIGN KEY (player) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_buddy_id_fkey FOREIGN KEY (buddy_id) REFERENCES public.caught(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.quest_baselines
    ADD CONSTRAINT quest_baselines_player_fkey FOREIGN KEY (player) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.quest_claims
    ADD CONSTRAINT quest_claims_player_fkey FOREIGN KEY (player) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.quest_progress
    ADD CONSTRAINT quest_progress_player_fkey FOREIGN KEY (player) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.raid_invites
    ADD CONSTRAINT raid_invites_raid_id_fkey FOREIGN KEY (raid_id) REFERENCES public.raids(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.raid_invites
    ADD CONSTRAINT raid_invites_recipient_fkey FOREIGN KEY (recipient) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.raid_invites
    ADD CONSTRAINT raid_invites_sender_fkey FOREIGN KEY (sender) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.raid_rewards
    ADD CONSTRAINT raid_rewards_player_fkey FOREIGN KEY (player) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.raid_rewards
    ADD CONSTRAINT raid_rewards_raid_id_fkey FOREIGN KEY (raid_id) REFERENCES public.raids(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.raid_watchers
    ADD CONSTRAINT raid_watchers_player_fkey FOREIGN KEY (player) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.raid_watchers
    ADD CONSTRAINT raid_watchers_raid_id_fkey FOREIGN KEY (raid_id) REFERENCES public.raids(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.raids
    ADD CONSTRAINT raids_host_fkey FOREIGN KEY (host) REFERENCES public.users(id);

ALTER TABLE ONLY public.rocket_party
    ADD CONSTRAINT rocket_party_generation_stop_id_player_fkey FOREIGN KEY (generation, stop_id, player) REFERENCES public.rocket_stops(generation, stop_id, player) ON DELETE CASCADE;

ALTER TABLE ONLY public.rocket_stops
    ADD CONSTRAINT rocket_stops_battle_id_fkey FOREIGN KEY (battle_id) REFERENCES public.battles(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.rocket_stops
    ADD CONSTRAINT rocket_stops_player_fkey FOREIGN KEY (player) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.rotation_baselines
    ADD CONSTRAINT rotation_baselines_player_fkey FOREIGN KEY (player) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.rotation_claims
    ADD CONSTRAINT rotation_claims_player_fkey FOREIGN KEY (player) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.snapshot_spawns
    ADD CONSTRAINT snapshot_spawns_generation_chunk_seed_zone_fkey FOREIGN KEY (generation, chunk_seed, zone) REFERENCES public.snapshots(generation, chunk_seed, zone) ON DELETE CASCADE;

ALTER TABLE ONLY public.staff_actions
    ADD CONSTRAINT staff_actions_actor_fkey FOREIGN KEY (actor) REFERENCES public.users(id);

ALTER TABLE ONLY public.staff_actions
    ADD CONSTRAINT staff_actions_target_fkey FOREIGN KEY (target) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.team_catches
    ADD CONSTRAINT team_catches_caught_id_fkey FOREIGN KEY (caught_id) REFERENCES public.caught(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.team_catches
    ADD CONSTRAINT team_catches_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.team_preset_catches
    ADD CONSTRAINT team_preset_catches_caught_id_fkey FOREIGN KEY (caught_id) REFERENCES public.caught(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.team_preset_catches
    ADD CONSTRAINT team_preset_catches_preset_id_fkey FOREIGN KEY (preset_id) REFERENCES public.team_presets(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.team_presets
    ADD CONSTRAINT team_presets_player_fkey FOREIGN KEY (player) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.team_snapshots
    ADD CONSTRAINT team_snapshots_player_fkey FOREIGN KEY (player) REFERENCES public.users(id);

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_player_fkey FOREIGN KEY (player) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_raid_id_fkey FOREIGN KEY (raid_id) REFERENCES public.raids(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.towns
    ADD CONSTRAINT towns_found_by_fkey FOREIGN KEY (found_by) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.trades
    ADD CONSTRAINT trades_asked_caught_fkey FOREIGN KEY (asked_caught) REFERENCES public.caught(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.trades
    ADD CONSTRAINT trades_given_caught_fkey FOREIGN KEY (given_caught) REFERENCES public.caught(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.trades
    ADD CONSTRAINT trades_offered_caught_fkey FOREIGN KEY (offered_caught) REFERENCES public.caught(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.trades
    ADD CONSTRAINT trades_proposer_fkey FOREIGN KEY (proposer) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.trades
    ADD CONSTRAINT trades_receiver_fkey FOREIGN KEY (receiver) REFERENCES public.users(id) ON DELETE CASCADE;

-- Every part of the game a staff switch can close, all open
INSERT INTO public.switches (feature) VALUES
  ('everything'), ('auctions'), ('trades'), ('stops'), ('raids'), ('duels'),
  ('gym-seats'), ('gifts'), ('townsfolk'), ('catching'), ('claims');

-- The sweeps that keep old rows from piling up
select cron.schedule(
  'sweep-claim-markers',
  '43 * * * *',
  $$
    delete from cache_claims where claimed_at < (extract(epoch from now()) * 1000)::bigint - 86400000;
    delete from berry_claims where claimed_at < (extract(epoch from now()) * 1000)::bigint - 86400000;
    delete from nest_claims where claimed_at < (extract(epoch from now()) * 1000)::bigint - 86400000;
    delete from phenomenon_claims where claimed_at < (extract(epoch from now()) * 1000)::bigint - 86400000;
    delete from npc_claims where claimed_at < (extract(epoch from now()) * 1000)::bigint - 86400000;
  $$
);

select cron.schedule(
  'sweep-fled-encounters',
  '17 * * * *',
  $$
    delete from fled_encounters
    where window_at < (extract(epoch from now()) * 1000)::bigint - 3600000
  $$
);

select cron.schedule(
  'sweep-old-announcements',
  '23 4 * * *',
  $$
    delete from announcements
    where ends_at < (extract(epoch from now()) * 1000)::bigint - 2592000000;
  $$
);

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

select cron.schedule(
  'sweep-old-ledger',
  '41 3 * * *',
  $$
    delete from ledger
    where at < (extract(epoch from now()) * 1000)::bigint - 5184000000;
  $$
);

select cron.schedule(
  'sweep-old-lobbies',
  '37 * * * *',
  $$
    delete from duels
    where created_at < (extract(epoch from now()) * 1000)::bigint - 86400000;
  $$
);

select cron.schedule(
  'sweep-released-catches',
  '17 * * * *',
  $$
    delete from caught
    where released_by is not null
    and released_at < (extract(epoch from now()) * 1000)::bigint - 86400000;
  $$
);

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

select cron.schedule(
  'sweep-stale-snapshots',
  '53 * * * *',
  $$
    delete from snapshots
    where window_at < (extract(epoch from now()) * 1000)::bigint - 86400000;
  $$
);
