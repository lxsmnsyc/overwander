-- Economy: auctions, the one-lot-per-seller marker, and player bids.

create table auctions (
  id           text primary key,
  seller       uuid not null references auth.users(id),
  lot          smallint not null,
  item         integer,
  caught_id    text references caught(id),
  starting_bid bigint not null check (starting_bid between 1 and 1000000),
  increment    bigint not null check (increment between 1 and 1000000),
  bid          bigint not null default 0,
  bidder       uuid references auth.users(id),
  created_at   bigint not null,
  ends_at      bigint not null,
  utc_offset   smallint not null,
  settled      boolean not null default false,
  check ((lot = 0 and item is not null and caught_id is null)
      or (lot = 1 and caught_id is not null and item is null)),
  check (bidder is distinct from seller)
);

create index auctions_live on auctions (ends_at) where not settled;
create index auctions_seller on auctions (seller);

create table auction_sellers (
  player  uuid primary key references auth.users(id) on delete cascade,
  auction text not null references auctions(id),
  ends_at bigint not null
);

-- One row per bidder and lot: bidding again rewrites, never appends
create table bids (
  player  uuid not null references auth.users(id) on delete cascade,
  auction text not null references auctions(id),
  amount  bigint not null check (amount > 0),
  bid_at  bigint not null,
  primary key (player, auction)
);
