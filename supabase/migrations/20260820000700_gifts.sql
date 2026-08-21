-- Gifts: closed to clients end to end; everything moves through the
-- server. A NULL player is an open gift standing on every shelf.
--
-- The offer itself rides as jsonb: it is a write-once union of three
-- shapes, read whole by the server and never queried by field, which
-- is the same argument that froze team snapshots. The two columns
-- beside it are the two things the shelf actually asks the store:
-- whose it is, and when it was put up.

create table gifts (
  id         text primary key,
  player     uuid references auth.users(id) on delete cascade,
  offered_at bigint not null,
  gift       jsonb not null check (jsonb_typeof(gift) = 'object'),
  -- The pokemon frozen exactly as rolled at offer time, so a species
  -- day between offer and claim cannot change what the box showed
  encounter  jsonb check (encounter is null or jsonb_typeof(encounter) = 'object')
);

create index gifts_player on gifts (player) where player is not null;

-- Written inside the hand-over transaction: what makes an open gift
-- takeable exactly once per player
create table gift_claims (
  gift_id    text not null references gifts(id),
  player     uuid not null references auth.users(id) on delete cascade,
  claimed_at bigint not null,
  catch_id   text references caught(id),
  primary key (gift_id, player)
);

create index gift_claims_player on gift_claims (player);
