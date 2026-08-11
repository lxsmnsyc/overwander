# Items and gold

Almost everything a player carries was dug out of the ground. There is no shop
yet, so the overworld item pool is the economy's supply side and raids are its
mint.

## What the ground holds

Three landmarks give items, and each rolls on the same rarity bands the spawn
pools use: special 1/4096, rare 1/64, uncommon 1/8, base for the rest.

### The item pool

| Band         | What is in it                                                                                                                                 |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Base**     | Poke, Great, Premier, Heal and Luxury Balls; Pearls and Stardust; the everyday medicine; Energy and Heal Powder                               |
| **Uncommon** | The utility balls; Big Pearls and Star Pieces; Super and Hyper Potions, Full Heals, Energy Roots; the six wings                               |
| **Rare**     | Evolution stones; Nuggets; Max Potions, Full Restores, Revives, Revival Herbs; Bottle Caps; the Purifying Gem; the species relics; the plates |
| **Special**  | Master Ball, Shiny Charm, Golden Bottle Cap, Portal Key, and the raid relics                                                                  |

Two placements are deliberate. **Valuables sit a band below what they are worth**
— they are a steady trickle of gold rather than a jackpot, so the rarest bands
stay for the things gold cannot buy. And **machines are absent entirely**: they
are meant to be bought, never found.

The plates and the wings each take a single thin slot, so seventeen plates
together are worth about one stone: digging up the plate you wanted stays luck
rather than shopping.

### A stash, not an item

An **Item Cache** holds a stash. The band roll is read as a **ceiling** rather
than a choice — it is the best thing in there, and one of that kind is
guaranteed. How many *kinds* is a separate draw (up to `MAX_KINDS`, 3), and every
kind after the first rolls its own band, clamped to that ceiling. So a stash may
be two rares and a base, or three commons, or one of each. Rarity and count being
independent is what stops a good dig from being the same three slots every time.

Each kind carries up to `MAX_STACK` (3) pieces on a draw of its own, and two
kinds landing on the same item merge into one stack that still respects the cap.

A special is a ceiling like any other, so a stash may well be a Master Ball and
two stones. Two things it can never be: **two specials**, since only the opening
draw reaches that band, and **more than one piece** of a special — a Master Ball
found three at a time would stop being a Master Ball.

### A berry patch

A patch is a bush rather than a buried box, so it bears **one kind** and 3–5
pieces of it: the rarity is the interesting draw and the count is only how good a
season it had. It fruits on the 15-minute landmark window — picked or not, the
next window grows something new.

| Band         | What grows there                                                        |
| ------------ | ----------------------------------------------------------------------- |
| **Base**     | The five single-status cures                                            |
| **Uncommon** | Leppa, Oran, Persim, and the five bitter berries                        |
| **Rare**     | Lum, Sitrus, the five that answer a blow, and the eighteen type-resists |
| **Special**  | The pinch berries, held against the moment the holder is nearly out     |

### A hidden grotto

A grotto gives either a stash on its own bands — which **shut the base tier out**,
so nothing common is ever in one — or a pokemon, derived so that every observer
of that grotto meets the same individual.

### A buddy with Pickup

The one source that is not a landmark. A **Pickup** buddy turns something up
every `PICKUP_STEP_INTERVAL` (512) steps walked, drawn from the ordinary item
pool with the **special band shut out** — a ball, a potion, now and then a stone,
but never a Master Ball scuffed off a path.

What it counts is the marks the walk crossed rather than the steps in a report,
so a player who reports in small handfuls finds exactly as much as one who
reports in large ones. The find lands in the bag as the steps are credited, and
the walk is told about it.

## What a berry does

Berries are the one item class that is worth carrying into a fight, since a
pokemon holds exactly one item and medicine cannot be used mid-battle. Each is
written once and triggers on its own.

| Kind                      | When it goes off                  | What it does                                                           |
| ------------------------- | --------------------------------- | ---------------------------------------------------------------------- |
| **Status cures**          | The status lands                  | Takes it off; a Lum takes any of them                                  |
| **Oran, Sitrus**          | Half health                       | 10 points, or a quarter of the pool                                    |
| **Type resists** (18)     | A hard-landing blow of their type | Halves it                                                              |
| **Bitter** (5)            | Half health                       | A third of the pool back, confusing a pokemon whose nature dislikes it |
| **Pinch stats** (4)       | A quarter health                  | One stage; a Starf gives two of a random stat                          |
| **Lansat, Custap, Micle** | A quarter health                  | Crit ratio, priority, or accuracy on one move                          |
| **Enigma**                | Hit super-effectively             | A quarter of the pool back                                             |
| **Jaboca, Rowap**         | Hit physically or specially       | An eighth of the attacker's pool off them                              |
| **Kee, Maranga**          | Hit physically or specially       | A defence stage                                                        |
| **Effort drops** (6)      | Fed out of battle                 | 10 training points off one stat, and friendship                        |

Ten of them can also be fed to a wild encounter to make it easier to catch — see
[Catching](catching.md).

## Wings

Six wings, one per stat, each granting 3 points of effort **and** raising the
pokemon's effort allowance by the same, so a wing adds to the budget instead of
spending it. They are the only effort a pokemon ever gets that its levels did not
pay for, which is why they are thin slots in the uncommon band. See
[Raising](raising.md).

## Gold

Gold is a balance on the profile, and the server owns every movement of it.

**Where it comes from:**

| Source                      | Amount                             |
| --------------------------- | ---------------------------------- |
| Clearing a mythical raid    | 3,000                              |
| Clearing a legendary raid   | 2,000                              |
| Clearing a shadow raid      | 1,000                              |
| Beating a Team Rocket grunt | 500                                |
| Winning an auction lot      | The seller is paid the winning bid |

Every fighter in a raid is paid the same purse, and a **Luck Incense** held by
the buddy doubles it.

**Where it goes:**

| Sink                   | Amount             |
| ---------------------- | ------------------ |
| A breeder's egg        | 5,000              |
| A daycare lady's boost | 2,500              |
| A groomer's visit      | 2,500              |
| An auction bid         | Whatever was named |

The three NPCs are the pacing mechanism as much as the price: each serves a
player once per six-hour window per cell, so gold buys convenience rather than
volume.

**No market yet.** Items carry `buy` and `sell` prices and a `Marketable` flag,
and nothing reads them: the Pearls and Nuggets a walk turns up are worth gold in
principle and unsellable in practice. Until a shop exists, the auction house is
the only way an item becomes gold.

## Auctions

The auction house is the one place something passes from one player to another,
and two decisions carry the whole feature:

- **A lot is taken when it is listed.** The item leaves the bag, or the pokemon
  leaves the seller's records, at the moment the auction opens — so a seller
  cannot list what they have since spent, and nothing has to be checked again a
  day later. It does not come back.
- **A bid is paid when it is made.** The gold is taken as the bid lands and
  handed straight back to whoever it outbid, so the last bidder standing is by
  definition somebody whose gold is already in.

A lot runs for `AUCTION_DURATION` (24 hours) and a player may have **one lot at a
time**, which — since a lot runs a full day — is one a day. The seller may not
bid, and the standing bidder may not bid against themselves until somebody
outbids them. There is no ceiling: the increment is the floor on a raise, not its
size, so a lot worth having can be put out of reach in one bid.

A pokemon that changes hands arrives as a stranger: its friendship resets to
`BASE_FRIENDSHIP`, so gold buys the pokemon and never the walking behind it.

Four pokemon cannot be listed at all: one **fighting**, one **waiting in a raid
lobby**, an **egg** — a bidder cannot see into one and the seller can — and the
**buddy** at the player's side. A lot cannot be taken back off the block, so the
buddy is refused rather than quietly sent home: making that sale takes one
deliberate press first.

Nothing happens when bidding closes, because there is no job to run — somebody
comes back for the lot. Usually that is the winner; a lot **nobody bid on** has
no winner, so the seller takes it back instead, unsold and unpaid for. What a
seller cannot do is take it back *early*: a listing that could be pulled the
moment a bid looked unlikely is not one anybody would bid on.

The details are in [Auctions](../firestore/auctions.md).
