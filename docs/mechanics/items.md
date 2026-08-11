# Items and gold

Almost everything a player carries was dug out of the ground. The only shop is a
vendor who wanders, and he stocks balls and medicine alone — so the overworld
item pool is still the economy's supply side, and raids are its mint.

## What the ground holds

Three landmarks give items, and each rolls on rarity bands: special 1/4096,
**prized 1/512**, rare 1/64, uncommon 1/8, base for the rest. The three ordinary
bands are the spawn pools'; the prized band is the item pool's own, since a
species has no equivalent of a thing that changes a pokemon for good. The widths
are slices rather than running totals, so adding a band takes its share out of
**base** and leaves every other band as wide as it was.

### The item pool

| Band         | What is in it                                                                                                                 |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| **Base**     | Poke, Great, Premier, Heal and Luxury Balls; Pearls and Stardust; the everyday medicine; Energy and Heal Powder               |
| **Uncommon** | The utility balls; Big Pearls and Star Pieces; Super and Hyper Potions, Full Heals, Energy Roots; Heart Scales; the six wings |
| **Rare**     | Evolution stones; Nuggets; Max Potions, Full Restores, Revives, Revival Herbs; the species relics; the plates                 |
| **Prized**   | Bottle Caps, the Purifying Gem, Max Revives                                                                                   |
| **Special**  | Master Ball, Shiny Charm, Golden Bottle Cap, Portal Key, and the raid relics                                                  |

The line between rare and prized is **permanence**. Rare is where a walk turns up
something that gets a party through the next fight — a stone, a Revive, a plate.
Prized is where it turns up something that changes a pokemon for good and cannot
be undone: a Bottle Cap fixes what it was born with, a Purifying Gem takes a
shadow off it, a Max Revive is the answer to a lost *party* rather than a lost
fight. All three used to be rare, and being drawn as often as an evolution stone
made them read as ordinary.

Unlike a special, a prized find is **not** one-of-a-kind: a stash may hold two,
and they are dug up in stacks like anything else. Two Bottle Caps in one hole is
a very good dig, not a broken one.

Two placements are deliberate. **Valuables sit a band below what they are worth**
— they are a steady trickle of gold rather than a jackpot, so the rarest bands
stay for the things gold cannot buy. And **machines are absent entirely**: they
are meant to be bought, never found.

The plates and the wings each take a single thin slot, so seventeen plates
together are worth about one stone: digging up the plate you wanted stays luck
rather than shopping.

The bands are read for one thing besides the digging. Spending an item **on a
pokemon** asks a second time only where the item is `isPreciousItem` — the
**prized and special** bands, and nothing below them. It is the same line the two
bands were split on: those are the finds that change a pokemon for good or cannot
be come by again, and the wrong pokemon is the wrong pokemon for good with them.

Scarcity alone is deliberately not the test. A Full Restore is a rare dig and
still only a fight's worth of healing, so it goes through on one press like a
Potion — everything a player heals with is spent over and over, and a confirmation
on each is a click for nothing. What earns the second press is what a mistake
costs, not what the walk cost.

The **Heart Scale** is the one thing in the pool that gold cannot substitute for.
No vendor stocks one and no vendor takes one, so it is neither bought nor sold:
what a scale is worth is exactly one forgotten move, put back by the
[Move Reminder](../firestore/overworld.md#wandering-npcs). That is what keeps
remembering a move paced by walking rather than by a purse.

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

### A phenomenon

Something going on at a cell rather than something buried in it, and the only
landmark whose **kind** is rolled: which of the four is happening depends on the
biome and turns over every hour. Half the time it is something to pick up, half
the time it is a pokemon — the uncommon band, or the rare one in eight — and
either way a player gets **one** of them per cell per hour.

| Phenomenon         | What it leaves behind                            | Where it happens                     |
| ------------------ | ------------------------------------------------ | ------------------------------------ |
| **Hidden Grotto**  | Nothing — a pokemon, or 1/64 an egg of the biome | Forests, swamps, scrub               |
| **Dust Cloud**     | One gem, stone, plate or valuable                | Deserts, mountains, cold open ground |
| **Rippling Water** | One valuable                                     | Anywhere with water in it            |
| **Flying Shadow**  | One wing                                         | Open country and high ground         |

The **dust cloud is the richest**: it is the only place a stone or a plate is
found outside a cache, and the only ordinary source of gems. The **grotto pays in
pokemon** instead — it never leaves an item at all, and one grotto in sixty-four
holds an egg of the biome, which is the same egg a nest would have laid without
the half-day wait or the walk.

### A buddy with Pickup

The one source that is not a landmark. A **Pickup** buddy turns something up
every `PICKUP_STEP_INTERVAL` (512) steps walked, drawn from the ordinary item
pool with the **top two bands shut out** — a ball, a potion, now and then a
stone, but never a Master Ball scuffed off a path, and never a Bottle Cap
either. A prized find is a walk's worth of luck; one a Meowth turns up on the way
past would make the band worth nothing, which is the same argument that shut the
special band out first.

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
| Selling to a vendor         | The item's `sell` price, per piece |

Every fighter in a raid is paid the same purse, and a **Luck Incense** held by
the buddy doubles it.

**Where it goes:**

| Sink                   | Amount                            |
| ---------------------- | --------------------------------- |
| A breeder's egg        | 5,000                             |
| A daycare lady's boost | 2,500                             |
| A groomer's visit      | 2,500                             |
| Buying from a vendor   | The item's `buy` price, per piece |
| An auction bid         | Whatever was named                |

The three paid NPCs are the pacing mechanism as much as the price: each serves a
player once per six-hour window per cell, so gold buys convenience rather than
volume.

### The vendor

The **Vendor** is the shop, and he wanders like everyone else. He is the one
passer-by with **no once-per-window limit** — what the others hand over is
something the world cannot make twice in six hours, and what he hands over is a
potion, so his crate and the player's purse are the whole of the limit.

He carries six kinds, derived from the window the same way he is: always a Poke
Ball and a Potion, the rest drawn from the balls and the medicine. A player who
wants an Ultra Ball walks until they find somebody carrying one.

He **buys** anything `Marketable`, which is what finally makes the Pearls, Star
Pieces and Nuggets a walk turns up worth something. He pays the registry's
`sell`, half of the `buy` he charges for the same item, so nothing bought from
him can be sold back at a profit. The **Master Ball** is the one ball the
registry never priced, so it is in neither half of his trade — excluded by the
missing flag rather than by a list that could fall out of step. The **Heart
Scale** is out of both halves for the same reason and to the same end: a scale a
player is carrying is a move they can have back, and a price would let them spend
it on something else.

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
