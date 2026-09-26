# Auction bids

What a bid does to the gold, how a closed lot is handed over or taken back, and
what escrow does to a pokemon on the block.

## What a bid does

`placeBid` runs in one transaction:

1. The auction is read and checked with `canBid`.
2. The bidder's balance is read, and the outbid bidder's alongside it. They are
   never the same row, since nobody outbids themselves, so the two move
   independently.
3. The outbid bid is refunded, the new one is taken, `bid` and `bidder` are
   written, and the bidder's own `bids` row is rewritten with what they just
   named.

A bid the balance cannot cover changes nothing and resolves null.

`canBid` refuses three things:

- **The seller**, who would be selling to themselves.
- **The standing bidder**, until somebody outbids them. They are already
  winning, so bidding again could only cost them gold, and it would let a lot be
  walked up to a price nobody else ever offered. Once outbid they may bid again,
  against a floor that has moved.
- **Anything under `nextBid`**: the asking price while the lot is untouched, and
  the standing bid plus the seller's increment after that.

There is **no ceiling**. The increment is the floor on a raise rather than its
size, so a bidder may name anything from `nextBid` up to what they are holding,
and a lot worth having can be put out of reach in one bid rather than a hundred.
The board's input opens at `nextBid` and accepts anything above it; the balance
is the real limit, and it is checked where the gold moves.

## `bids`

| Column    | Type     | Notes                                     |
| --------- | -------- | ----------------------------------------- |
| `player`  | `uuid`   | The bidder                                |
| `auction` | `text`   | The lot bid on                            |
| `amount`  | `bigint` | The last amount they named for it         |
| `bid_at`  | `bigint` | When they last bid, on the server's clock |

The pair is the primary key, so bidding again rewrites rather than appending.

The auction keeps only the bid that is standing. That is all a lot needs in
order to settle, who to hand it to and what to pay the seller, and a lot that
kept everybody who ever bid on it would grow a list nothing settling it ever
reads.

A player's history is a different question asked by a different reader, so it
lives on their side: one row per lot they have bid on, rewritten with the last
amount they named. Being outbid does not touch it, which is the point: it is how
a player finds the lot they were outbid on an hour ago.

Written only by the server, in the same transaction as the bid it records, and
private to the owning uid.

`listBidHistory` reads these newest first and joins the lots they name.
`getBidState` then says where the player stands, read off the lot itself:

| State       | When                                             |
| ----------- | ------------------------------------------------ |
| `Leading`   | They are the standing bidder, bidding still open |
| `Outbid`    | Somebody else is, and bidding is still open      |
| `Won`       | Bidding closed with them in front, uncollected   |
| `Lost`      | Bidding closed with somebody else in front       |
| `Collected` | Won and claimed                                  |

`Outbid` is the one state a player can still do something about, and `canRebid`
is that question. The Bids panel puts a bid box on those rows, so a raise is
made from the history rather than by finding the lot on the board again. A `Won`
row gets a Collect button for the same reason.

## Collecting

Nothing happens at the instant bidding closes, because there is no job to run
one, so the winner comes back for the lot. `claimAuction` checks `canClaim`,
which is bidding closed, unsettled, and the caller as the last bidder, then in
one transaction:

- an **item** lot lands in the winner's stack;
- a **catch** lot comes out of escrow: `owner` becomes the winner's uid, an
  `Acquisition.Auction` entry is appended to its history, stamped in the new
  owner's own zone the way a catch date is, and its `friendship` is **reset to
  `BASE_FRIENDSHIP`**. What it walked, levelled and was groomed for belonged to
  the seller, and a pokemon that arrived inseparable would make being loved
  something that can be bought;
- the seller is paid the winning bid;
- `settled` is set, which is the claim marker: the lot is collected once and the
  purse is paid once.

## Taking a lot back

An auction that closes with **no bidder** has no winner to hand anything to, so
the lot goes back where it came from. `reclaimAuction` checks `canReclaim`,
which is bidding closed, unsettled, nobody having bid, and the caller as the
seller, then in one transaction returns the item to the seller's stack or the
pokemon to their records and sets `settled`.

Nothing is paid, because nothing was sold, and the catch's ownership `history`
and `friendship` are both left alone: it did not change hands, it sat on a shelf
for a day and came back to the same person.

Reclaiming and collecting are the same handover seen from either end, and they
share the one marker. `canClaim` needs a bidder and `canReclaim` needs none, so
no auction can satisfy both, and `settled` stops either happening twice.

Bidding closing is what unlocks it. A seller cannot take a lot back while it is
still running: that would let a listing be pulled the moment a bid looked
unlikely, and a board whose lots can vanish is not one anybody would bid on.

## Escrow

A pokemon on the block keeps its row. Its `owner` is set to **null**, which is
nobody, and no policy matches a null owner. Every write that touches a catch
asks whether the caller is its `owner`, and a uid is never null, so an escrowed
pokemon is refused to the seller, the bidders and everyone else by the checks
that were already there. It stays **readable**, which is what lets a bidder see
what they are bidding on.

Escrow always ends: the winner collects it, or, if nobody bid, the seller takes
it back. Nothing stays ownerless once the day is up and somebody has come for
it.

## See also

- [Auctions](auctions.md), the listing, the board and what may go on the block
- [Catches](catches.md), the record an escrowed pokemon keeps
