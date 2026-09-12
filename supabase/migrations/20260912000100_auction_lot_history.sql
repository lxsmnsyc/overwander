-- A settled lot may outlive the pokemon it named.
--
-- Releasing a pokemon deletes its row, and `20260830000100` made the
-- auctions that had named it survive that by nulling their pointer:
-- "history keeps its shape and loses its pointer". The table's own
-- check was never told. It reads that a pokemon lot must name a
-- catch, so the moment the pointer went null the row satisfied
-- neither arm and the release came back refused. A pokemon that had
-- ever been auctioned could not be let go, whether it was sold and
-- collected or taken back unbid, and a batch release failed whole
-- because one member of it had once been on the block.
--
-- So the pointer is allowed to go, but only once the lot is over. A
-- **live** listing must still name its catch: the pokemon is in
-- escrow with no owner while the bidding runs, nothing may release it
-- from there, and a lot on the block with nothing on it would be a
-- lot nobody could bid on.
--
-- An item lot is unchanged: it names an item and never a catch.

alter table auctions drop constraint auctions_check;

alter table auctions add constraint auctions_lot_check check (
  (lot = 0 and item is not null and caught_id is null)
  or (lot = 1 and item is null and (caught_id is not null or settled))
);
