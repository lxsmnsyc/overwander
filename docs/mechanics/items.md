# Items and gold

Almost everything a player carries was dug out of the ground. The only shop is a
[vendor who wanders](npcs.md), and he stocks balls and medicine alone, so the
overworld is the game's supply of items and raids are its supply of gold.

## Using what you carry

The bag is a tray of pictures. Resting on one brings up a card saying what the
thing is, what it does and how many are carried, and — for anything that is spent
on a pokemon rather than held, sold or handed to somebody — a **Use** button.
Pressing it asks which pokemon, offering only the ones the item would do some
good, and that press spends it: what it came to is said over the bag. Two items
ask a question back first, because neither can be undone. A **machine** asks
which move is given up for the one it teaches, and a **PP Up** or **PP Max**
asks which move the points land on; nothing leaves the bag until that is
answered.

## Where items come from

Three landmarks give items — the **item cache**, the **berry patch** and the
**phenomenon** — and a buddy with **Pickup** finds them while walking. Each source
rolls first for a rarity band:

| Band     | Odds     |
| -------- | -------- |
| Special  | 1/4096   |
| Prized   | 1/512    |
| Rare     | 1/64     |
| Uncommon | 1/8      |
| Base     | The rest |

### The item pool

| Band         | Contents                                                                                                                                                                                                                                                                                                          |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Base**     | Poke, Great, Premier, Heal and Luxury Balls; Pearls, Stardust, shoal salt and shells, Pretty Wings, Tiny Mushrooms, Relic Copper; Black Sludge and a Sticky Barb; the everyday medicine; Energy and Heal Powder                                                                                                   |
| **Uncommon** | The eight utility balls; Big Pearls, Star Pieces, Big Mushrooms, Rare Bones, Relic Silver; Super and Hyper Potions, Full Heals, Energy Roots; Heart Scales; the six wings; the sixteen one-shot answers, from a Focus Sash to a Weakness Policy; the Everstone; the four weather rocks, Light Clay and a Big Root |
| **Rare**     | The five evolution stones; Nuggets and the richer valuables; Max Potions, Full Restores, Revives, Revival Herbs; the species relics; the seventeen plates and the type-boosting gear; the choice items, the vest and the Eviolite; the three orbs; Leftovers, a Shed Shell and the rest of the battle gear        |
| **Prized**   | Bottle Caps, the Purifying Gem, the Utility Belt, Max Revives, the Sacred Ash, the Portal Key, the Amulet Coin, the six power items, all three fossils, the ruins                                                                                                                                                 |
| **Special**  | Master Ball, Shiny Charm, Golden Bottle Cap, the raid relics, the Relic Crown                                                                                                                                                                                                                                     |

The line between rare and prized is **permanence**. Rare is where a walk turns up
something that gets a party through the next fight: a stone, a Revive, a plate.
Prized is where it turns up something that changes a pokemon for good and cannot
be undone — a Bottle Cap fixes what a pokemon was born with, a Purifying Gem
removes a shadow, a Max Revive answers a lost _party_ rather than a lost fight.

A prized find is not unique. A stash may hold two, and they come in stacks like
anything else.

Two placements are deliberate. **Valuables sit one band below what they are
worth**, making them a steady trickle of gold rather than a jackpot, and
**machines are never found**: they are meant to be bought. The plates and the
wings each occupy a very thin slot, so all seventeen plates together are worth
about one evolution stone.

Using a **prized or special** item on a pokemon asks for confirmation. Nothing
below that does: a Full Restore is a rare find and still only a fight's worth of
healing, so it goes through on one press like a Potion. What earns a second press
is what a mistake costs, not what the walk cost.

The **Heart Scale** is the one item gold cannot substitute for. No vendor stocks
one or takes one, so a scale is worth exactly one forgotten move, restored by the
[Move Reminder](npcs.md).

The **fossils** are the only items worth a pokemon. Each names one species — a
Helix Fossil an Omanyte, a Dome Fossil a Kabuto, an Old Amber an Aerodactyl — and
none of those three appears anywhere in the world, so reviving one at the
[Fossil Scientist](npcs.md) is the only way to meet them. All three sit in the
**prized** band, with the amber the thinnest slot of the three.

### Item caches

An **item cache** holds a stash rather than a single item. The rarity it rolled
is the **best thing in there**, and one of that kind is guaranteed. How many
_kinds_ it holds is a separate roll of up to three, and each further kind rolls
its own rarity beneath that ceiling. A stash might therefore be two rares and a
common, three commons, or one of each: rarity and quantity are independent, which
stops a good dig being the same three slots every time.

Each kind comes in up to **three pieces**.

A stash can be a Master Ball and two stones. Two things it can never be: **two
specials**, and **more than one piece** of a special — a Master Ball found three
at a time would stop being a Master Ball.

### Berry patches

A patch is a bush rather than a buried box, so it bears **one kind** of berry and
**three to five** pieces of it. It fruits every 15 minutes; picked or not, the
next window grows something new.

| Band         | What grows there                                                        |
| ------------ | ----------------------------------------------------------------------- |
| **Base**     | The five single-status cures                                            |
| **Uncommon** | Leppa, Oran, Persim, and the five bitter berries                        |
| **Rare**     | Lum, Sitrus, the five that answer a blow, and the eighteen type-resists |
| **Special**  | The pinch berries, and the six silver and gold prize berries            |

### Apricorn trees

A tree bears **one colour** of apricorn and **three to five** of them, on the
same 15-minute clock a berry patch fruits on. The colour is the tree's own and
never changes: the tree is drawn bearing it, so a red one is a landmark you can
walk back to.

An apricorn is worth nothing on its own. **Kurt**, who passes through the
wandering cells, carves one into the ball it stands for: seven colours, seven
balls, none of them for sale anywhere.

### Phenomena

A **phenomenon** is something happening at a cell rather than something buried in
it. Which of the four is happening depends on the biome and changes every hour.
Half the time it leaves an item and half the time it produces a pokemon, and
either way a player gets **one** per cell per hour.

| Phenomenon         | Item half                         | Pokemon half                           |
| ------------------ | --------------------------------- | -------------------------------------- |
| **Hidden Grotto**  | Nothing at all                    | A pokemon, or 1/64 an egg of the biome |
| **Dust Cloud**     | One gem, stone, plate or valuable | A pokemon                              |
| **Rippling Water** | One valuable                      | A pokemon                              |
| **Flying Shadow**  | One wing                          | A pokemon                              |

The pokemon is drawn from the biome's **uncommon** band, or its **rare** band one
time in eight.

What a phenomenon leaves starts at **uncommon**: it does not hand over what an
ordinary walk turns up anyway, and the two bands above that are eight times as
wide as the ground makes them. It has no special band at all. The only one of
those its pools ever reach is the **Relic Crown**, drawn with the other ruins
rather than at a rate of its own, so nothing happening at a cell leaves a Master
Ball or a Shiny Charm.

The **dust cloud is the richest** phenomenon: it is the only source of a stone or
a plate outside an item cache, and the only ordinary source of gems. The
**grotto** pays in pokemon instead — it never leaves an item at all, and one
grotto in sixty-four holds an egg of the biome, which is the same egg a nest
would have laid without the half-day wait.

### Pickup

The one source that is not a landmark. A buddy with **Pickup** finds something
every **512 steps** walked, drawn from the ordinary item pool with the **top two
bands excluded**: a ball, a potion, occasionally a stone, but never a Master Ball
scuffed off a path and never a Bottle Cap.

## Battle gear

A pokemon can carry a piece of gear into a fight instead of a berry. Gear is
never used up: it works for as long as it is held.

| Gear                       | What it does                                                                      |
| -------------------------- | --------------------------------------------------------------------------------- |
| **Leftovers**              | Gives back a sixteenth of its holder's health every time it acts                  |
| **Big Root**               | 1.3× on everything its holder drains                                              |
| **Light Clay**             | Screens its holder puts up last 1.6× as long                                      |
| **The four weather rocks** | Weather its holder calls lasts 1.6× as long                                       |
| **The seventeen plates**   | Moves of the plate's type hit 1.2× harder                                         |
| **Shed Shell**             | Its holder can always flee, whatever is holding it                                |
| **Sticky Barb**            | Costs its holder an eighth of its health a move, and sticks to whoever touches it |

Most of what a pokemon can hold is gear of some kind, and the ground turns up all
of it:

| Kind                  | What is in it                                                                         |
| --------------------- | ------------------------------------------------------------------------------------- |
| **Type boosters**     | Eighteen, one per type, and the plates beside them                                    |
| **Hitting harder**    | A Muscle Band, Wise Glasses, an Expert Belt, a Life Orb                               |
| **Choosing**          | The three Choice items: one move, in exchange for a stat and a half                   |
| **Standing up**       | An Assault Vest, an Eviolite, a Focus Band, a Rocky Helmet                            |
| **Accuracy and luck** | A Wide Lens, a Zoom Lens, a Scope Lens, Bright Powder, a Quick Claw                   |
| **Turning a fight**   | The sixteen one-shots: a Focus Sash, a Weakness Policy, an Eject Button, a White Herb |
| **Costing something** | A Flame Orb, a Toxic Orb, a Sticky Barb, an Iron Ball                                 |

The **species relics** are the same idea for one pokemon each: a Thick Club for a
Cubone, a Light Ball for a Pikachu, a Lucky Punch for a Chansey, a Stick for a
Farfetch'd, and Metal and Quick Powder for a Ditto. They are worth nothing to
anybody else.

The **six power items** are the odd ones out: they are worn for breeding rather
than for a fight, and each names one stat and passes it straight to an egg.

## Drinks and treats

The wandering chef keeps the one shelf nothing else stocks, and both halves of it
are carried into a fight rather than spent out of one.

- **Drinks** give health back the moment their holder drops low: Fresh Water 30
  points, Soda Pop 60, Lemonade 80, Moomoo Milk a hundred, and a Berry Juice the
  20 a handful of berries is worth.
- **Treats** are a Full Heal in the hand. The seven regional sweets clear every
  status a pokemon carries; a Rage Candy Bar and a Sweet Heart feed their holder
  instead, the way a drink does.

Both are cheaper than the bottle they stand in for, and both sell back at half
like anything else on a counter.

## Berries

A berry is what a pokemon carries into a fight when it is not carrying gear. No
medicine can be used mid-battle, so what a pokemon holds when the fight starts is
all the help it gets. Each berry triggers on its own.

| Kind                      | Trigger                           | Effect                                                                 |
| ------------------------- | --------------------------------- | ---------------------------------------------------------------------- |
| **Status cures** (5)      | The status lands                  | Removes it; a Lum removes any of them                                  |
| **Oran, Sitrus**          | Half health                       | 10 points, or a quarter of the pool                                    |
| **Type resists** (18)     | A hard-landing blow of their type | Halves it                                                              |
| **Bitter** (5)            | Half health                       | A third of the pool back, confusing a pokemon whose nature dislikes it |
| **Pinch stats** (5)       | A quarter health                  | One stat stage; a Starf gives two of a random stat                     |
| **Lansat, Custap, Micle** | A quarter health                  | Critical hit odds, priority, or accuracy on one move                   |
| **Enigma**                | Hit super-effectively             | A quarter of the pool back                                             |
| **Jaboca, Rowap**         | Hit physically or specially       | An eighth of the attacker's health off them                            |
| **Kee, Maranga**          | Hit physically or specially       | A defence stage                                                        |
| **Effort drops** (6)      | Fed out of battle                 | 10 training points off one stat, and friendship gained                 |

Ten berries can also be fed to a wild pokemon to make it easier to catch,
fourteen further berries do nothing but that, and six rarer ones buy catch odds,
a pokemon that will not bolt, or double and triple candy; see
[Catching](catching.md#berries).

## Wings

Six wings, one per stat. Each grants 3 training points **and** raises the
pokemon's training budget by the same amount, so a wing adds to what there is to
spend instead of spending it. They are the only training a pokemon ever receives
that its levels did not pay for. See [Raising a pokemon](raising.md#training).

## Gold

### Where it comes from

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
per winner, so the same trainer pays two players differently. Two items on the
**buddy** raise a player's own share wherever it came from: a **Luck Incense**
doubles it, and an **Amulet Coin** trebles it.

### Where it goes

| Sink                    | Amount                          |
| ----------------------- | ------------------------------- |
| A breeder's egg         | 5,000                           |
| A daycare lady's boost  | 2,500                           |
| A groomer's visit       | 2,500                           |
| A fossil off the maniac | 12,000, or 30,000 for the amber |
| Buying from a vendor    | The item's price, per piece     |
| An auction bid          | Whatever was named              |

The four paid travellers set the pace as much as the price, since each helps a
player once per three-hour window at a given cell: gold buys convenience rather
than volume. The maniac's fossil is the most expensive because it is the only
purchase that buys a **pokemon** — one of the three the world does not produce at
all.

## Auctions

The auction house is the one place something passes from one player to another.
It is read at an **auction board**, one of the landmarks a chunk can hold, and
nowhere else: trading is somewhere you walk to. Every board posts the same
lots, so which one you reach does not matter, only that you reach one.

Bidding happens there and nowhere else. Being outbid is something you find out
from your profile, but answering it costs the same walk the first bid did.

Your own side of it stays on your profile. **Bids** holds everything you have
bid on and where each one stands, and is where a lot you won is collected.
**Selling** holds everything you have put up: what is still on the block, what
sold, and — the one that matters — anything that closed with nobody bidding. A lot nobody bid on comes
back only when you ask for it, so until you do, the pokemon sits in escrow
belonging to nobody. The Selling tab counts those on the tab itself, because
nothing else in the game will ever mention one.

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
buys the pokemon, never the walking behind it.

What may be listed is deliberately narrow, since one listing a day is the
scarcest thing a player has and anything outside these is something a bidder
could walk out and find for themselves:

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

Nothing happens when bidding closes, because somebody must come back for the lot.
Usually that is the winner; a lot **nobody bid on** has no winner, so the seller
reclaims it unsold. What a seller cannot do is reclaim it _early_: a listing that
could be pulled the moment a bid looked unlikely is not one anybody would bid on.

The board is a single list, newest lot first. A lot that has stopped taking bids
stays in place with a Collect or a Take-it-back button where the bid box was.

## See also

- [The world](world.md)
- [People you meet](npcs.md)
- [Raising a pokemon](raising.md)
