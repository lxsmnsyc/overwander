-- The economy ledger: one row for every change to gold, an item stack
-- or a candy stack.
--
-- rAthena keeps `picklog` and `zenylog` for the same reason: when
-- something looks duplicated or a balance jumps, the question is where
-- it came from and how far it spread, and a balance cannot answer it.
-- Each row says whose it was, what moved (gold, or which item or candy
-- family), by how much, what it came to, why where the writer said,
-- and which transaction moved it. The two sides of a trade or a sale
-- share a transaction id, which is how they are found together.
--
-- Written by the server inside the same transaction as the change,
-- and only while its `ECONOMY_LEDGER` variable is on, so a server that
-- does not want it has an empty table and pays nothing. Pokemon are
-- not here: `caught_history` already keeps every owner of a catch.
--
-- About 190 bytes a row. Rows are swept at 60 days, which keeps a
-- dozen busy players near 80 MB.

create table ledger (
  id      bigint generated always as identity primary key,
  player  uuid not null references auth.users(id) on delete cascade,
  -- 0 gold, 1 an item, 2 a candy family
  kind    smallint not null check (kind between 0 and 2),
  -- The item or family; 0 for gold
  key     integer not null,
  delta   bigint not null,
  balance bigint not null,
  reason  text,
  tx      bigint not null default txid_current(),
  at      bigint not null default (extract(epoch from now()) * 1000)::bigint
);

create index ledger_player on ledger (player, at desc);
create index ledger_tx on ledger (tx);

alter table ledger enable row level security;

select cron.schedule(
  'sweep-old-ledger',
  '41 3 * * *',
  $$
  delete from ledger
  where at < (extract(epoch from now()) * 1000)::bigint - 5184000000;
  $$
);
