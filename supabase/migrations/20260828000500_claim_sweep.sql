-- Sweeping the claim markers.
--
-- A marker's key embeds the window it belongs to, so the moment that
-- window rolls the row can never match a lookup again: every later
-- query is keyed to a different timestamp. Nothing deleted them, so
-- the five tables grew forever on rows no query could return.
--
-- Only cache_claims carried a timestamp, and the rest encoded theirs
-- inside the marker text, where a sweep would have to parse it back
-- out. Each gets a `claimed_at` of its own instead, which is what the
-- job below reads. Existing rows default to 0 and go on the first
-- pass, which is right: every one of them is already unreachable.
--
-- The margin is a day. The longest-lived claim is a nest's, whose
-- window is twelve hours, so a day clears every kind with room to
-- spare and no marker is ever swept while it could still refuse a
-- second claim.

alter table berry_claims add column claimed_at bigint not null default 0;
alter table nest_claims add column claimed_at bigint not null default 0;
alter table phenomenon_claims add column claimed_at bigint not null default 0;
alter table npc_claims add column claimed_at bigint not null default 0;

create index cache_claims_swept on cache_claims (claimed_at);
create index berry_claims_swept on berry_claims (claimed_at);
create index nest_claims_swept on nest_claims (claimed_at);
create index phenomenon_claims_swept on phenomenon_claims (claimed_at);
create index npc_claims_swept on npc_claims (claimed_at);

-- Hourly, like the fled sweep, and off the same clock. cache_claim_items
-- cascades off its parent and needs no statement of its own
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
