# Gold and auctions

Where a player's gold comes from, what it is spent on, and the auction house
where one player's things pass to another.

## Where gold comes from

| Source                                               | Amount                       |
| ---------------------------------------------------- | ---------------------------- |
| Clearing a mythical raid                             | 200,000                      |
| Clearing a legendary raid                            | 80,000                       |
| Clearing a shadow raid                               | 35,000                       |
| Beating a roadside trainer or a Team Rocket grunt    | 5,000 to 15,000              |
| Beating a gym leader                                 | 20,000 to 50,000             |
| Beating an Ace Trainer                               | 25,000 to 60,000             |
| Beating a Rocket executive                           | 40,000 to 90,000             |
| Beating one of the Elite Four                        | 50,000 to 110,000            |
| Beating Giovanni                                     | 120,000 to 250,000           |
| Beating a Champion                                   | 150,000 to 300,000           |
| Taking a gym seat                                    | A tenth of the loser's purse |
| Selling an auction lot                               | The winning bid              |
| Selling to a vendor or the chef                      | The item's price, per piece  |

Everyone in a raid is paid the same amount. Everything else rolls its own purse
per winner, so the same trainer pays two players differently.

Two items on the **buddy** raise a player's own share wherever it came from: a
**Luck Incense** doubles it, and an **Amulet Coin** trebles it.

## Where gold goes

| Sink                    | Amount                          |
| ----------------------- | ------------------------------- |
| A breeder's egg         | 5,000                           |
| A daycare lady's boost  | 2,500                           |
| A groomer's visit       | 2,500                           |
| A fossil off the maniac | 12,000, or 30,000 for the amber |
| Buying from a vendor    | The item's price, per piece     |
| An auction bid          | Whatever was named              |

The four paid travellers set the pace as much as the price, since each helps a
player once per three-hour window at a given cell. Gold buys convenience rather
than volume. The maniac's fossil is the most expensive because it is the only
purchase that buys a **pokemon**, one of the three the world does not produce at
all.

## Auctions

The auction house is the one place something passes from one player to another.
It is read at an **auction board**, one of the landmarks a chunk can hold, and
nowhere else. Trading means walking to a board. Every board posts the same lots,
so which one a player reaches does not matter, only that they reach one.

Bidding happens there and nowhere else. Being outbid is something a player finds
out from their profile, but answering it costs the same walk the first bid did.

A player's own side of it stays on their profile. **Bids** holds everything they
have bid on and where each one stands, and is where a lot they won is collected.
**Selling** holds everything they have put up: what is still on the block, what
sold, and anything that closed with nobody bidding. A lot nobody bid on comes
back only when the seller asks for it, so until they do, the pokemon is held in
escrow and belongs to nobody. The Selling tab counts those on the tab itself,
because nothing else in the game will ever mention one.

Two rules carry the whole feature:

- **A lot is taken when it is listed.** The item leaves the bag, or the pokemon
  leaves the seller's collection, the moment the auction opens, and it does not
  return while the auction runs.
- **A bid is paid when it is made.** The gold is taken as the bid lands and
  returned to whoever it outbid, so the last bidder standing has already paid.

A lot runs for **24 hours**, and a player may have **one lot at a time**, which
amounts to one a day. A seller may not bid on their own lot, and a standing
bidder may not raise their own bid until somebody outbids them. There is no
ceiling: the increment is the smallest raise allowed rather than the largest, so
a desirable lot can be put out of reach in a single bid.

A pokemon that changes hands arrives as a stranger, its friendship reset. Gold
buys the pokemon and not the walking behind it.

What may be listed is deliberately narrow. One listing a day is the scarcest
thing a player has, and anything below these bars is something a bidder could
walk out and find for themselves.

| A lot          | The bar it has to clear                                                  |
| -------------- | ------------------------------------------------------------------------ |
| **An item**    | The **special** band, and nothing below it                               |
| **A pokemon**  | Perfect stats, no stats at all, shiny, or a special-tier species         |

Four are refused even when they qualify:

| Refused                   | Why                                                     |
| ------------------------- | -------------------------------------------------------- |
| One **in a fight**        | It is busy being something else                         |
| One **in a raid lobby**   | The same                                                |
| An **egg**                | A bidder cannot see inside one and the seller can       |
| The **buddy**             | A lot cannot be withdrawn, so it is refused up front rather than quietly sent home |

Nothing happens when bidding closes, because somebody must come back for the
lot. Usually that is the winner. A lot **nobody bid on** has no winner, so the
seller reclaims it unsold. What a seller cannot do is reclaim it _early_: a
listing that could be pulled the moment a bid looked unlikely is not one
anybody would bid on.

The board is a single list, newest lot first. A lot that has stopped taking bids
stays in place with a Collect or a Take-it-back button where the bid box was.

## See also

- [Items](items.md): the special band a listed item has to reach
- [Where items come from](item-sources.md)
- [People you meet](npcs.md): the vendors and travellers who take gold
- [Friends](friends.md): the auction house is open to everybody
- [Battles](battles.md): the purses a fight pays
