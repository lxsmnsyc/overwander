-- Letting a pokemon go deletes its row, and four tables pointed at
-- that row without saying what should happen to them. A pokemon that
-- had ever been auctioned, traded, gifted or taken into a raid party
-- could not be released at all: the delete raised a foreign key
-- violation and the release came back refused.
--
-- History keeps its shape and loses its pointer. An auction, a trade
-- and a gift claim are records of what happened, and the catch they
-- name is gone, so the column goes null. A raid party is not history:
-- it is the party of a raid that is over, so it goes with the catch.
--
-- Nothing here lets a *live* listing lose its catch. An open auction
-- or trade holds the pokemon in escrow, where its owner is null, and
-- a release refuses anything the player does not own.

alter table auctions
  drop constraint auctions_caught_id_fkey,
  add constraint auctions_caught_id_fkey
    foreign key (caught_id) references caught(id) on delete set null;

alter table gift_claims
  drop constraint gift_claims_catch_id_fkey,
  add constraint gift_claims_catch_id_fkey
    foreign key (catch_id) references caught(id) on delete set null;

alter table trades
  alter column offered_caught drop not null,
  drop constraint trades_offered_caught_fkey,
  add constraint trades_offered_caught_fkey
    foreign key (offered_caught) references caught(id) on delete set null,
  drop constraint trades_asked_caught_fkey,
  add constraint trades_asked_caught_fkey
    foreign key (asked_caught) references caught(id) on delete set null,
  drop constraint trades_given_caught_fkey,
  add constraint trades_given_caught_fkey
    foreign key (given_caught) references caught(id) on delete set null;

alter table team_catches
  drop constraint team_catches_caught_id_fkey,
  add constraint team_catches_caught_id_fkey
    foreign key (caught_id) references caught(id) on delete cascade;
