# Items

What a player carries, what each kind of item does, and what a pokemon can take
into a fight.

Almost everything a player carries was dug out of the ground. The only shop is a
[vendor who wanders](npcs.md), and he stocks balls and medicine alone. The
overworld is the game's supply of items, and raids are its supply of gold.
[Where items come from](item-sources.md) covers the digging, and
[Gold and auctions](economy.md) covers the money.

## Using what you carry

The bag is a tray of pictures. Resting on one brings up a card saying what the
thing is, what it does and how many are carried. Anything that is spent on a
pokemon rather than held, sold or handed to somebody also gets a **Use** button.
Pressing it asks which pokemon, offering only the ones the item would do some
good, and that press spends it. What it came to is said over the bag.

Two items ask a question back first, because neither can be undone. A
**machine** asks which move is given up for the one it teaches, and a **PP Up**
or **PP Max** asks which move the points land on. Nothing leaves the bag until
that is answered.

Using a **prized or special** item on a pokemon asks for confirmation. Nothing
below that does: a Full Restore is a rare find and still only a fight's worth of
healing, so it goes through on one press like a Potion. What earns a second
press is what a mistake costs, not what the walk cost.

## The item pool

Every source of items rolls first for a rarity band:

| Band     | Odds     |
| -------- | -------- |
| Special  | 1/4096   |
| Prized   | 1/256    |
| Rare     | 1/64     |
| Scarce   | 1/16     |
| Uncommon | 1/4      |
| Base     | The rest |

| Band         | Contents                                                                                                                                                                                                                                                                                                          |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Base**     | Poke, Great, Premier, Heal and Luxury Balls; Pearls, Stardust, shoal salt and shells, Pretty Wings, Tiny Mushrooms, Relic Copper; Black Sludge and a Sticky Barb; the everyday medicine; Energy and Heal Powder                                                                                                   |
| **Uncommon** | The seven utility balls; Big Pearls, Star Pieces, Big Mushrooms, Rare Bones; Super Potions and Full Heals; Heart Scales; the Everstone |
| **Scarce**   | Ultra Balls; Relic Silver; Hyper Potions, Energy Roots, Max Potions, Revives and Revival Herbs; the six wings; the sixteen one-shot answers, from a Focus Sash to a Weakness Policy; the type boosters and the everyday gear, from a Muscle Band to a Scope Lens; the four weather rocks, Light Clay and a Big Root; a Shed Shell, Heavy-Duty Boots and Loaded Dice; the Macho Brace, the Soothe Bell, the Exp. Share and the Lucky Egg |
| **Rare**     | The evolution stones and the Rotom Catalog; Nuggets and the richer valuables; Full Restores and Max Revives; the species relics and the Soul Dew; the seventeen plates and the Drives; the choice items, the vest and the Eviolite; the Flame, Toxic and Life Orbs; Leftovers; the Meteorite, the Adamant, Lustrous and Griseous Orbs and the Gracidea |
| **Prized**   | Bottle Caps, the Purifying Gem, the Utility Belt, the Ability Capsule, the Ability Patch, the Sacred Ash, the Portal Key, the Amulet Coin, the six power items, the fossils, the ruins, the 21 mints |
| **Special**  | Master Ball, Shiny Charm, Golden Bottle Cap, the four raid relics (the Old Sea Map, the **GS Ball**, the **Wish Tag** and the **Aurora Ticket**), the Relic Crown                                                                                                                                                                                          |

The line between uncommon and scarce is **use**. Uncommon restocks a bag: balls,
potions, the smaller valuables. Scarce is gear and training, the things that
change how a fight or a build goes.

The line between rare and prized is **permanence**. Rare is where a walk turns
up something that gets a party through the next fight: a stone, a Full Restore,
a plate. Prized is where it turns up something that changes a pokemon for good
and cannot be undone. A Bottle Cap fixes what a pokemon was born with, a
Purifying Gem removes a shadow, a fossil brings back a species nothing else can.

A prized find is not unique. A stash may hold two, and they come in stacks like
anything else.

Two placements are deliberate. **Valuables sit one band below what they are
worth**, making them a steady trickle of gold rather than a jackpot, and
**machines are never found**: they are meant to be bought. The plates and the
wings each occupy a very thin slot, so all seventeen plates together are worth
about one evolution stone.

The **Heart Scale** is the one item gold cannot substitute for. No vendor stocks
one or takes one, so a scale is worth exactly one forgotten move, restored by
the [Move Reminder](npcs.md).

The **fossils** are the only items worth a pokemon. Each names one species: a
Helix Fossil an Omanyte, a Dome Fossil a Kabuto, an Old Amber an Aerodactyl, and
none of those three appears anywhere in the world, so reviving one at the
[Fossil Scientist](npcs.md) is the only way to meet them. All three sit in the
**prized** band, with the amber the thinnest slot of the three.

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

Most of what a pokemon can hold is gear of some kind, and the ground turns up
all of it:

| Kind                  | What is in it                                                                         |
| --------------------- | ------------------------------------------------------------------------------------- |
| **Type boosters**     | Eighteen, one per type, and the plates beside them                                    |
| **Hitting harder**    | A Muscle Band, Wise Glasses, an Expert Belt, a Life Orb                               |
| **Choosing**          | The three Choice items: one move, in exchange for a stat and a half                   |
| **Standing up**       | An Assault Vest, an Eviolite, a Focus Band, a Rocky Helmet                            |
| **Accuracy and luck** | A Wide Lens, a Zoom Lens, a Scope Lens, Bright Powder, a Quick Claw                   |
| **Turning a fight**   | The sixteen one-shots: a Focus Sash, a Weakness Policy, an Eject Button, a White Herb |
| **Costing something** | A Flame Orb, a Toxic Orb, a Sticky Barb, an Iron Ball                                 |

The **species relics** are the same idea for one pokemon each: a Thick Club for
a Cubone, a Light Ball for a Pikachu, a Lucky Punch for a Chansey, a Stick for a
Farfetch'd, and Metal and Quick Powder for a Ditto. They are worth nothing to
anybody else.

The **six power items** are the odd ones out. They are worn for breeding rather
than for a fight, and each names one stat and passes it straight to an egg.

## Drinks, treats and mints

The wandering chef keeps the one shelf nothing else stocks. Two thirds of it are
carried into a fight rather than spent out of one. The rest is spent on a
pokemon and changes it for good.

- **Drinks** give health back the moment their holder drops low: Fresh Water 30
  points, Soda Pop 60, Lemonade 80, Moomoo Milk a hundred, and a Berry Juice the
  20 a handful of berries is worth.
- **Treats** are a Full Heal in the hand. The seven regional sweets clear every
  status a pokemon carries; a Rage Candy Bar and a Sweet Heart feed their holder
  instead, the way a drink does.
- **Mints** change a pokemon's nature to the one on the jar, for good. There are
  21, and the ground hides them too. See [raising](raising.md) for what a nature
  is worth.

The drinks and the treats are cheaper than the bottle they stand in for, and
everything on his counter sells back at half like anything else.

**Honey** works the same way and is not on any counter. A buddy with **Honey
Gather** comes up with a jar the first time it acts in a fight, if it has a hand
free, and the jar restores 40 points to whoever holds it once they drop to a
quarter.

## Berries

A berry is what a pokemon carries into a fight when it is not carrying gear. No
medicine can be used mid-battle, so what a pokemon holds when the fight starts
is all the help it gets. Each berry triggers on its own.

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

Where berries grow is covered in [Where items come from](item-sources.md).

## Wings

Six wings, one per stat. Each grants 3 training points **and** raises the
pokemon's training budget by the same amount, so a wing adds to what there is to
spend instead of spending it. They are the only training a pokemon ever receives
that its levels did not pay for. See [Training a
pokemon](training.md#training-points).

## See also

- [Where items come from](item-sources.md)
- [Gold and auctions](economy.md)
- [The world](world.md)
- [People you meet](npcs.md)
- [Raising a pokemon](raising.md)
- [Training a pokemon](training.md)
