# Auctions

The auction house is the one place something passes from one player to another.
Everything about it is decided by the server in
[`src/server/auctions.ts`](../../src/server/auctions.ts); the rules both sides
read it by — what a bid has to clear, when bidding closes, who may collect —
live in [`src/auth/auction-record.ts`](../../src/auth/auction-record.ts), and the
browser reads the board through
[`src/auth/auctions.ts`](../../src/auth/auctions.ts).

Two decisions carry the whole feature, and nothing has to sweep up after either:

- **A lot is taken when it is listed.** The item leaves the bag and the pokemon
  leaves the seller's records at the moment the auction opens, so a seller
  cannot list what they have since spent, and nothing has to be checked again a
  day later. It cannot be pulled off the block either — a seller who changes
  their mind waits the day out, and may not bid on their own lot — so a listing
  is something a bidder can trust for as long as it runs. Only a lot the day
  ended on with **no bid at all** goes back, and the seller has to come and take
  it.
- **A bid is paid when it is made.** The gold is taken as the bid lands and
  handed straight back to whoever it outbid, so the last bidder standing is by
  definition somebody whose gold is already in. Nothing can be won by a player
  who spent the money in the meantime.

## `auctions/{auctionId}`

| Field         | Type            | Notes                                                            |
| ------------- | --------------- | ---------------------------------------------------------------- |
| `seller`      | `string`        | Who listed it; may not bid, and is paid when the winner collects |
| `lot`         | `AuctionLot`    | `Item` or `Catch`                                                |
| `item`        | `Items \| null` | The item on the block, `null` for a catch lot                    |
| `caught`      | `string`        | The `caught/{catchId}` on the block, empty for an item lot       |
| `startingBid` | `number`        | What the first bid has to be                                     |
| `increment`   | `number`        | What every bid after it has to add                               |
| `bid`         | `number`        | The standing bid, zero while nobody has bid                      |
| `bidder`      | `string`        | Who placed it, empty while nobody has                            |
| `createdAt`   | `number`        | When it opened, on the server clock                              |
| `endsAt`      | `number`        | `createdAt + AUCTION_DURATION` — a day later                     |
| `offset`      | `number`        | Minutes east of UTC the seller listed it in                      |
| `settled`     | `boolean`       | Whether the lot has been handed over                             |

Readable by every signed-in player — a board nobody can see is not a board —
and written only by the server. `watchOpenAuctions` follows
`where('settled', '==', false)`, which is both the lots still taking bids and
the ones whose winner has not come back for them; which of the two a listing is
depends on the clock rather than the document, so the caller splits them with
`isLive`.

**Nothing is polled.** A closing time is a number the listing was written with,
and whether it has passed is the reader's own clock against it — no timer, no
re-read, no second opinion asked of the server while somebody looks at the
board. Being a minute out of step with the server changes nothing that matters:
a lot the reader thinks is still open is refused by `canBid` when the bid
actually lands, and a lot they think has closed is claimable the moment they
ask. The board is a view; the server decides.

The terms a seller sends are normalized by `asAuctionTerms` before anything is
written: whole numbers, `startingBid` in `[MIN_STARTING_BID, MAX_STARTING_BID]`
and `increment` in `[MIN_INCREMENT, MAX_INCREMENT]`. A caller cannot be trusted
with them, and refusing an auction over a stray decimal helps nobody.

## `auctionSellers/{uid}`

| Field     | Type     | Notes                                     |
| --------- | -------- | ----------------------------------------- |
| `player`  | `string` | Owning uid, matching the document id      |
| `auction` | `string` | The `auctions/{auctionId}` they listed    |
| `endsAt`  | `number` | When it closes; another cannot open until |

One document per seller, read inside the same transaction that opens an
auction. It is what keeps a player to **one auction at a time** — and since an
auction runs a full day, that is one auction a day. A single field read answers
both halves of the rule, so no query and no calendar arithmetic is involved: a
seller whose lot is still on the block is refused, whatever zone they report.

Private to the owning uid, and read-only to them: the sell form asks it before
offering to list anything.

## What the board shows

A lot on the block is named, priced, timed and **attributed**: who listed it,
read from `profiles/{uid}` — the reader is "you" rather than their own nickname,
and a seller whose profile has gone is still "a trainer".

A **catch** lot carries a second line with the three things a bidder is actually
buying and cannot change afterwards: how good its individual values are, its
nature and its abilities. They are read straight off the escrowed record, which
is exactly why escrow keeps the document readable instead of copying a name into
the listing. Health and status are not shown as anything but the name's own
condition — both are cosmetic the moment the pokemon changes hands.

The values are shown as a **rating**, not as six numbers: `getIVStars` gives one
star per `MAX_IV` (31) points across all six, so ★★★★★★ is flawless and ★★★☆☆☆ is
ordinary. It is deliberately lossy. Printing the numbers does the buyer's
arithmetic for them and turns a bid into a lookup; a rating says how good the
pokemon is without saying which stat carries it, so the bid stays a judgement and
the rest is learned by winning. A pokemon the player already owns still shows all
six.

Clicking a catch lot opens the **catch dialog read-only** (`readOnly`): the whole
record — values, nature, abilities, moves, friendship, origin and the ownership
chain — and nothing to press. The prop drops the dialog's owner check, since a
lot in escrow is owned by nobody and requiring a match would show an empty
dialog, and leaves out every section that writes. It is not a permission: the
server refuses all of those writes anyway. It is so the buttons are never
offered.

An **egg** lot shows none of it. What is inside one is hidden from everybody but
its owner, and a board is not the place to give it away — which is also why
`openAuction` refuses to list one at all.

## What a bid does

`placeBid` runs in one transaction:

1. The auction is read and checked with `canBid`.
2. The bidder's balance is read, and the outbid bidder's alongside it. They are
   never the same document — nobody outbids themselves — so the two move
   independently.
3. The outbid bid is refunded, the new one is taken, `bid`/`bidder` are written,
   and the bidder's own `bids/{uid}:{auctionId}` document is rewritten with what
   they just named.

A bid that the balance cannot cover changes nothing and resolves null.

`canBid` refuses three things:

- **The seller**, who would be selling to themselves.
- **The standing bidder**, until somebody outbids them. They are already winning
  the lot, so bidding again could only cost them gold — and it would let a lot
  be walked up to a price nobody else ever offered. Once they are outbid they
  may bid again, against a floor that has moved.
- **Anything under `nextBid`** — the asking price while the lot is untouched, the
  standing bid plus the seller's increment after that.

There is **no ceiling**. The increment is the floor on a raise, not its size: a
bidder may name anything from `nextBid` up to what they are holding, so a lot
worth having can be put out of reach in one bid rather than a hundred. The
board's input opens at `nextBid` and accepts anything above it; the balance is
the real limit, and it is checked where the gold moves.

## `bids/{uid}:{auctionId}`

| Field     | Type     | Notes                                         |
| --------- | -------- | --------------------------------------------- |
| `player`  | `string` | The bidder, matching the first half of the id |
| `auction` | `string` | The `auctions/{auctionId}` bid on             |
| `amount`  | `number` | The last amount they named for it             |
| `bidAt`   | `number` | When they last bid, on the server's clock     |

The auction keeps only the bid that is standing. That is all a lot needs to
settle — who to hand it to and what to pay the seller — and a lot that kept
everybody who ever bid on it would grow a list nothing settling it ever reads.

A player's history is a different question asked by a different reader, so it
lives on their side: one document per lot they have bid on, rewritten with the
last amount they named. Being outbid does not touch it, which is the point — it
is how a player still finds the lot they were outbid on an hour ago.

Written only by the server, in the same transaction as the bid it records.
Private to the owning uid.

`listBidHistory` reads these, newest first, and looks the lots up by the ids
they name (in batches, since `documentId() in [...]` is capped). `getBidState`
then says where the player stands, off the lot itself:

| State       | When                                             |
| ----------- | ------------------------------------------------ |
| `Leading`   | They are the standing bidder, bidding still open |
| `Outbid`    | Somebody else is, and bidding is still open      |
| `Won`       | Bidding closed with them in front, uncollected   |
| `Lost`      | Bidding closed with somebody else in front       |
| `Collected` | Won and claimed                                  |

`Outbid` is the one state a player can still do something about, and `canRebid`
is that question. The Bids panel puts a bid box on those rows, so a raise is
made from the history rather than by finding the lot on the board again — and a
`Won` row gets a Collect button, for the same reason.

## Collecting

Nothing happens at the instant bidding closes — there is no job to run one — so
the winner comes back for the lot. `claimAuction` checks `canClaim` (bidding
closed, unsettled, and the caller is the last bidder), then in one transaction:

- an **item** lot lands in the winner's stack;
- a **catch** lot comes out of escrow: `owner` becomes the winner's uid, an
  `Acquisition.Auction` entry is appended to its history — stamped in the new
  owner's own zone the way a catch date is, so the record says both when and how
  it changed hands — and its `friendship` is **reset to
  `BASE_FRIENDSHIP`** — what it walked, levelled and was groomed for belonged to
  the seller, and a pokemon that arrives inseparable would make being loved a
  thing that can be bought;
- the seller is paid the winning bid;
- `settled` is set, which is the claim marker — the lot is collected once and
  the purse is paid once.

## Taking a lot back

An auction that closes with **no bidder** has no winner to hand anything to, so
the lot goes back where it came from. `reclaimAuction` checks `canReclaim`
(bidding closed, unsettled, nobody bid, and the caller is the seller) and, in one
transaction, returns the item to the seller's stack or the pokemon to their
records, then sets `settled`.

Nothing is paid, because nothing was sold, and the catch's ownership `history`
and `friendship` are both left alone: it did not change hands, it sat on a shelf
for a day and came back to the same person.

Reclaiming and collecting are the same handover seen from either end, and they
share the one marker — `canClaim` needs a bidder and `canReclaim` needs none, so
no auction can ever satisfy both, and `settled` stops either happening twice.

Bidding closing is what unlocks it. A seller cannot take a lot back while it is
still running: that would let a listing be pulled the moment a bid looked
unlikely, and a board whose lots can vanish is not one anybody would bid on.

## Escrow

A pokemon on the block keeps its document. Its `owner` is set to
`AUCTION_ESCROW` — the empty string — which is nobody: every write that touches
a catch asks whether the caller is its `owner`, and a uid is never empty, so an
escrowed pokemon is refused to the seller, the bidders and everyone else by the
checks that were already there. It stays **readable**, which is what lets a
bidder see what they are bidding on.

Escrow always ends: the winner collects it, or — if nobody bid — the seller takes
it back. Nothing stays ownerless once the day is up and somebody has come for it.

Four pokemon are refused a listing outright, all of them inside the same
transaction that would have written it:

| Refused            | Checked with          | Why                                                                           |
| ------------------ | --------------------- | ----------------------------------------------------------------------------- |
| Fighting           | `isCatchLocked`       | The battle runs on a frozen copy of a record that has to still be there       |
| Waiting in a lobby | `isAnyCatchQueued`    | The lobby holds its id, so it would be silently dropped when the raid started |
| An egg             | `isEggRecord`         | A bidder cannot see into one and the seller can                               |
| The player's buddy | the profile's `buddy` | Not something to sell by misreading a list, and a lot cannot be taken back    |

The egg rule is about what an auction *is*. A catch lot is readable precisely so
that a bidder can look at what they are bidding on; an egg shows nothing but the
word "Egg" to everyone except the person selling it, who has known what is inside
since the moment it was found.

The buddy rule replaces something the code used to do: listing the buddy deleted
the profile's `buddy` in the same transaction, the way a release does. Refusing is
better than tidying up after — a lot cannot be taken off the block, so a
mis-click sold the pokemon the player walks with. Sending it home first is one
press, and it makes the sale deliberate.

Whatever it is holding goes with it. The item was handed to the pokemon, and the
pokemon is what is being sold.
