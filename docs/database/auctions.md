# Auctions

The auction house is the one place something passes from one player to another.
The server decides everything about it in
[`src/server/auctions.ts`](../../src/server/auctions.ts). The rules both sides
read, covering what a bid must clear, when bidding closes and who may collect,
live in [`src/auth/auction-record.ts`](../../src/auth/auction-record.ts), and
the browser reads the board through
[`src/auth/auctions.ts`](../../src/auth/auctions.ts).

Two decisions carry the whole feature, and neither needs anything swept up
afterwards:

- **A lot is taken when it is listed.** The item leaves the bag, or the pokemon
  the seller's records, the moment the auction opens, so nothing has to be
  re-checked a day later and a seller cannot list what they have since spent. It
  cannot be pulled off the block either, which is what makes a listing something
  a bidder can trust. Only a lot that ends the day with **no bid at all** goes
  back, and the seller has to come and take it.
- **A bid is paid when it is made.** The gold is taken as the bid lands and
  handed straight back to whoever it outbid, so the last bidder standing has
  already paid. Nothing can be won by a player who spent the money meanwhile.
  See [Auction bids](auction-bids.md).

## `auctions`

| Column         | Type       | Notes                                                            |
| -------------- | ---------- | ---------------------------------------------------------------- |
| `id`           | `text`     | The lot                                                          |
| `seller`       | `uuid`     | Who listed it; may not bid, and is paid when the winner collects |
| `lot`          | `smallint` | Item (0) or Catch (1)                                            |
| `item`         | `integer`  | The item on the block, null for a catch lot                      |
| `caught_id`    | `text`     | The catch on the block, null for an item lot                     |
| `starting_bid` | `bigint`   | What the first bid has to be                                     |
| `increment`    | `bigint`   | What every bid after it has to add                               |
| `bid`          | `bigint`   | The standing bid, zero while nobody has bid                      |
| `bidder`       | `uuid`     | Who placed it, null while nobody has                             |
| `created_at`   | `bigint`   | When it opened, on the server clock                              |
| `ends_at`      | `bigint`   | A day after it opened                                            |
| `utc_offset`   | `smallint` | Minutes east of UTC the seller listed it in                      |
| `settled`      | `boolean`  | Whether the lot has been handed over                             |

Two checks hold the shape of a lot: exactly one of `item` and `caught_id` is
filled, matching what `lot` says, and a bidder is never the seller.

Every signed-in player can read it, since a board nobody can see is of no use,
and only the server writes it. `watchOpenAuctions` follows the unsettled lots,
on the partial `auctions_live` index, which covers both the ones still taking
bids and the ones whose winner has not come back for them. Which of the two a
listing is depends on the clock rather than the row, so the caller splits them
with `isLive`. The table is published to realtime with `replica identity full`,
so the board sees the old row on a delete or a filtered update and can merge it
away.

**Nothing is polled.** The closing time is a number written into the listing,
and whether it has passed is the reader's own clock against it: no timer, no
re-read, no second opinion asked of the server while somebody looks at the
board. Being a minute out of step changes nothing that matters. A lot the reader
thinks is still open is refused by `canBid` when the bid actually lands, and a
lot they think has closed is claimable the moment they ask. The board only
displays; the server decides.

The terms a seller sends are normalized by `asAuctionTerms` before anything is
written: whole numbers, `startingBid` within `[MIN_STARTING_BID,
MAX_STARTING_BID]` and `increment` within `[MIN_INCREMENT, MAX_INCREMENT]`. A
caller cannot be trusted with them, and refusing an auction over a stray decimal
helps nobody.

## `auction_sellers`

| Column    | Type     | Notes                                     |
| --------- | -------- | ----------------------------------------- |
| `player`  | `uuid`   | The seller, and the primary key           |
| `auction` | `text`   | The lot they listed                       |
| `ends_at` | `bigint` | When it closes; another cannot open until |

One row per seller, read inside the same transaction that opens an auction. It
is what keeps a player to **one auction at a time**, and since an auction runs a
full day, that is one auction a day. A single row answers both halves of the
rule, so no query and no calendar arithmetic is involved: a seller whose lot is
still on the block is refused, whatever zone they report.

Private to the owning uid, and read-only to them. The sell form asks it before
offering to list anything.

## What the board shows

A lot on the block is named, priced, timed and **attributed**: who listed it,
read from `profiles`. The reader appears as "you" rather than their own
nickname, and a seller whose profile has gone is still "a trainer".

A **catch** lot carries a second line with the three things a bidder is buying
and cannot change afterwards: how good its individual values are, its nature and
its abilities. They are read straight off the escrowed record, which is exactly
why [escrow](auction-bids.md#escrow) keeps the row readable instead of copying a
name into the listing. Health and status are not shown, since both are cosmetic
the moment the pokemon changes hands.

The values are shown as a **rating** rather than as six numbers. `getIVStars`
gives one star per `MAX_IV` (31) points across all six, so ★★★★★★ is flawless
and ★★★☆☆☆ is ordinary. It is deliberately lossy: printing the numbers does the
buyer's arithmetic for them and turns a bid into a lookup, while a rating says
how good the pokemon is without saying which stat carries it. A pokemon the
player already owns still shows all six.

Clicking a catch lot opens the **catch dialog read-only** (`readOnly`): the
whole record, with values, nature, abilities, moves, friendship, origin and the
ownership chain, and nothing to press. The prop drops the dialog's owner check,
since a lot in escrow is owned by nobody and requiring a match would show an
empty dialog, and it leaves out every section that writes. It is not a
permission, since the server refuses all of those writes anyway. It is so the
buttons are never offered.

An **egg** lot shows none of it. What is inside one is hidden from everybody but
its owner, and a board is not the place to give it away, which is also why
`openAuction` refuses to list one at all.

## Searching the board

The board takes the same grammar the bag and the box do (`field:value` pairs, a
leading `!` to refuse one, `|` inside a value to accept any of several, a
comparison or a range for a number), asked of a lot rather than of something
owned. `AUCTION_VOCABULARY` and `matchesAuction` live in
[`auction-search.ts`](../../src/auth/auction-search.ts).

There is no query half: the board already holds every live lot, so every term is
answered over what it read.

| Field                         | What it narrows by                                                                                  |
| ----------------------------- | --------------------------------------------------------------------------------------------------- |
| a plain word                  | What the lot is called, item or pokemon                                                             |
| `seller:`                     | Who listed it, as the board says it, so `seller:you` is the reader's own                            |
| `shelf:`                      | Which shelf an item lot sits on                                                                     |
| `species:`, `type:`, `level:` | What a pokemon lot is, once the board has read the escrowed record                                  |
| `price:`, `start:`            | What it stands at (the bid, or the asking price where nobody has bid) and what it opened at         |
| `ends:`                       | Hours of bidding left, so `ends:<6` is the end of the board                                         |
| `is:`, `not:`                 | `item`, `pokemon`, `mine`, `bidding`, `bid`, `unbid`, `live`, `ended`, `settled`, `shiny`, `shadow` |
| `sort:`, `order:`             | `name`, `seller`, `price`, `start`, `ends`, `listed`, `level`                                       |

What the board writes for itself, the lot's name and the seller's, is handed to
the search as context rather than derived twice, along with the escrowed pokemon
and where the reader stands on the lot. A lot whose pokemon has not loaded yet
answers nothing about it, and stays on the board rather than disappearing while
it is being read.

## What may go on the block

A player runs one auction a day, so the block is the scarcest thing in the game,
and what sits on it decides what the whole feature is for. Left open to
anything, a day's listing goes on whatever happened to be in the bag, and the
board fills with Potions nobody would walk to a vendor for. So it is narrowed to
what a bidder **could not simply go and get for themselves**:

| Lot       | May be listed when                                                                     | Rule                 |
| --------- | -------------------------------------------------------------------------------------- | -------------------- |
| An item   | It is in the item pool's **special** band                                              | `isAuctionableItem`  |
| A pokemon | Its values are **perfect** or **all zero**, it is **shiny**, or it is **special-tier** | `isAuctionableCatch` |

The prized band is deliberately below the line for items. A Bottle Cap is worth
[asking twice before spending](../mechanics/items.md#the-item-pool), and it is
still something a player turns up by walking. The block is for what walking may
never turn up at all.

The four answers for a pokemon are four different reasons somebody else would
want it:

- **Perfect values** are six lucky rolls or a Golden Bottle Cap spent on them,
  and nothing else in the game hands them over.
- **All zero** is the other end of the same coin. Six rolls landing on 0 are
  exactly as rare as six landing on 31, a pokemon as bad as one can possibly be
  is a curiosity, and it is the only one of the four a player **cannot
  manufacture**: a cap raises values and never lowers them, so a blank record is
  found or not at all, and spending a cap on one destroys the thing that made it
  worth having.
- **Shiny** is the one thing a player cannot work towards.
- A **special-tier species** is a legendary or a mythical, which the world
  stages on its own schedule.

Anything else, a rare or a fully-evolved anything, a bidder can walk out and
catch, which is what makes it not worth a day of the board.

Both rules live in
[`src/auth/auction-record.ts`](../../src/auth/auction-record.ts) and are read by
both sides: the sell pickers leave out everything that fails, and `openAuction`
asks again from the **stored** record before it takes the lot.

The catch rule is also a **stored field**. `auctionable` on the catch record is
`isAuctionableCatch` written down, so the sell picker asks
`listCaughtMarked(player, 'auctionable')` instead of reading a whole box to find
the few rows that qualify. See [The marks are
fields](catch-training.md#auctionable-is-the-sixth-and-a-different-kind). The
field is an index and never an authority: the picker re-checks every row it
returns, and `openAuction` derives the answer from `ivs`, `shiny` and `species`
rather than reading it.

## Four pokemon refused outright

These are refused even when they would otherwise qualify, inside the same
transaction that would have written the listing:

| Refused            | Checked with          | Why                                                                           |
| ------------------ | --------------------- | ----------------------------------------------------------------------------- |
| Fighting           | `isCatchLocked`       | The battle runs on a frozen copy of a record that has to still be there       |
| Waiting in a lobby | `isAnyCatchQueued`    | The lobby holds its id, so it would be silently dropped when the raid started |
| An egg             | `isEggRecord`         | A bidder cannot see into one and the seller can                               |
| The player's buddy | the profile's `buddy` | Not something to sell by misreading a list, and a lot cannot be taken back    |

Unlike the eligibility rules above, these four are **shown and refused** rather
than hidden: a player looking for one of them wants the reason. What does not
qualify for the block at all is left out of the list, since that would be most
of a box and a hundred greyed rows say nothing.

The egg rule is about what an auction _is_. A catch lot is readable precisely so
a bidder can look at what they are bidding on; an egg shows nothing but the word
"Egg" to everyone except the person selling it, who has known what is inside
since the moment it was found.

The buddy rule refuses rather than tidies up afterwards. A lot cannot be taken
off the block, so a mis-click would sell the pokemon the player walks with.
Sending it home first is one press, and it makes the sale deliberate.

Whatever the pokemon is holding goes with it. The item was handed to the
pokemon, and the pokemon is what is being sold.

## See also

- [Auction bids](auction-bids.md), bidding, collecting and escrow
- [Catches](catches.md), the records a catch lot is taken from
- [The item pool](../mechanics/items.md#the-item-pool), the bands an item lot is
  drawn from
