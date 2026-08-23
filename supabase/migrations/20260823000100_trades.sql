-- Trades: friend-to-friend pokemon swaps.
--
-- The offered catch moves into escrow (owner null) as the offer is
-- written, the way an auction lot does, so an offer is something the
-- receiver can trust until it is answered or taken back. The asked
-- catch is never escrowed: it is checked again when the receiver
-- accepts, since it may have gone ineligible while the offer sat.

create table trades (
  id             text primary key,
  proposer       uuid not null references auth.users(id) on delete cascade,
  receiver       uuid not null references auth.users(id) on delete cascade,
  offered_caught text not null references caught(id),
  -- The catch asked in return, or null for an ask the receiver
  -- answers with a pick of their own
  asked_caught   text references caught(id),
  -- What the receiver actually gave; fills the open ask at accept
  given_caught   text references caught(id),
  -- Signed: positive rides with the offer, negative asks gold of the
  -- receiver. Whatever rides with the offer was taken when it was made
  gold           bigint not null default 0 check (gold between -1000000 and 1000000),
  status         smallint not null default 0,
  created_at     bigint not null,
  resolved_at    bigint,
  utc_offset     smallint not null,
  check (proposer <> receiver)
);

create index trades_proposer on trades (proposer);
create index trades_receiver on trades (receiver);
-- One open offer per direction of a pair
create unique index trades_open_pair on trades (proposer, receiver) where status = 0;

-- Tier 2: a trade is the two parties' business and nobody else's
alter table trades enable row level security;
create policy read on trades for select to authenticated
  using (proposer = auth.uid() or receiver = auth.uid());

grant select on trades to authenticated;
grant all on trades to service_role;

-- The inbox watches its own rows live, both directions
alter publication supabase_realtime add table trades;
alter table trades replica identity full;
