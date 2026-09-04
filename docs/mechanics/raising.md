# Raising a pokemon

Pokemon in Overwander do not gain experience from fighting. A pokemon grows
because its owner spends **candy** on it, assigns its **training points**, and
walks with it. All three are decisions rather than by-products of grinding.

## Levels and candy

Candy is held **per family** rather than per species, so anything in a line feeds
anything else in it: catching Caterpies levels a Butterfree.

| Rule                     | Value                     |
| ------------------------ | ------------------------- |
| Candy a catch pays       | 1 to 8, by how rare it is |
| On that family's own day | ×4                        |
| Candy one level costs    | 1, or **2** for a shadow  |
| Highest level            | 100                       |

What a catch pays depends on how hard it was to meet, since a candy is a level
and a level of a legendary is worth more work than a level of a Rattata:

| What was caught                         | Candy |
| --------------------------------------- | ----- |
| The first stage of a three-stage line    | 1     |
| The first stage of a two-stage line      | 2     |
| The middle of a three-stage line         | 3     |
| The end of a two-stage line              | 4     |
| The end of a three-stage line, or a one-off | 5  |
| A baby or an unown                       | 6     |
| A legendary                              | 7     |
| A mythical                               | 8     |

Two held items pay extra candy, each about half the time. An **Exp. Share** pays
the buddy's family, so everything caught feeds the one pokemon being raised. A
**Lucky Egg** pays the caught pokemon's family, filling out a collection faster.
Neither stacks with the species day, which already pays four times over.

A level is also a heal: the pokemon returns to full health with its statuses
cleared, and thinks slightly better of its trainer for it.

A **Rare Candy** is the exception to the family rule: used from the bag on any
pokemon, it buys one level no matter what family the pokemon belongs to and no
matter what its levels normally cost. Nothing sells them; they are prizes.

Releasing a pokemon pays its family the same candy catching it did — rarity and
all, though never the family-day bonus. Letting one go is a decision about space
rather than a punishment, and what the pokemon was worth does not change on the
way out.

## Names

A pokemon answers to its species until you name it. **Set nickname** on the catch
sheet gives it one of up to 24 characters; clearing the box takes the name
back off, and it goes back to being called by its kind. A name survives evolution
— that is rather the point of giving one — while a pokemon that was never named
is called by whatever it has just become. Eggs cannot be named: nothing has been
introduced yet.

A name belongs to the trainer who gave it. A pokemon that arrives already named,
won at auction, traded for, or handed over as a gift, keeps the name it came
with: the entry reads **Named by its first trainer** and does nothing. One that
arrives unnamed is yours to name, since there is nothing there to write over, and
a pokemon that finds its way back to the trainer who named it may be renamed by
them.

## Evolution

Only evolutions the game can verify are offered. The rest are never offered
rather than being waved through.

| Method                     | Supported | Notes                                     |
| -------------------------- | --------- | ----------------------------------------- |
| **By level**               | Yes       | Checked against the pokemon's level       |
| **Using an item**          | Yes       | The stone is consumed                     |
| **Holding an item**        | Yes       | The item is required, not consumed        |
| **By trade**               | Yes       | A pokemon that changed hands as what it is |
| Friendship, weather, party | No        | Nothing stores the answer, so not offered |

A **trade evolution** opens the moment a pokemon changes hands, and what it opens
is the evolution of whatever the pokemon was at that moment. A Machoke that was
traded is a Machamp waiting to be asked. A Machop that was traded and then grew
into a Machoke is not, because nobody ever traded a Machoke: it wants a handover
of its own. The mainline evolves one during the trade itself, which is a moment
this game has nowhere to put, so changing hands opens the evolution rather than
performing it, and it stays open until it is taken.

An **Everstone** refuses every evolution while the pokemon holds it. It is not
held back from anything else: it still levels, learns and fights.

Evolving preserves the individual's proportions, so a pokemon that was large for
its species stays large for its new one.

## Training

Training points arrive with levels rather than from fighting, and the owner
decides where they go: five points per level, so 500 across a full hundred
levels.

| Quantity | Meaning                                     |
| -------- | ------------------------------------------- |
| Budget   | 5 per level, plus anything wings have added |
| Spent    | Everything assigned across the six stats    |
| Unused   | What is left to assign                      |
| Per stat | Never more than 252                         |

Four training points buy one point of a stat, which is why 252 is the cap worth
having: anything above it would buy nothing.

A freshly caught level 20 pokemon therefore arrives with 100 unassigned points.
Three things move them:

- **Assigning** puts unused points into a stat or takes them back out. Nothing is
  consumed, so retraining is free and reversible forever.
- **A wing** grants 3 points in its own stat _and_ raises the pokemon's budget by
  the same, so a wing adds to what there is to spend rather than spending it. It
  is the only training a pokemon ever gets that its levels did not pay for, and
  it is worth the same at level 5 as at level 100.
- **A bitter berry** removes 10 points from one stat. They return to the unused
  pool rather than being lost, and the pokemon thinks better of its trainer for
  swallowing something unpleasant.
- **A vitamin** grants 10 points in its own stat and raises the budget by the
  same, the way a wing does: an HP Up, a Protein, an Iron, a Calcium, a Zinc or a
  Carbos. One bottle is three wings and a third, and it is the only training gold
  alone can buy, off a vendor's vitamin counter.

### PP Ups

A **PP Up** raises one move's points by a fifth of what it started with, up to
three times, and a **PP Max** takes it the whole way in one bottle. In this game
that buys a **shorter cooldown** rather than more uses, since nothing runs out
mid-fight: see [Battles](battles.md#how-a-move-resolves).

It is permanent. No berry takes it back, which is why they cost more than a
vitamin, and a move already at the limit is refused rather than charged.

## Friendship

Every pokemon carries a friendship score from 0 to 255. Gains **shrink as the
score grows**: the first hundred points come quickly and the last fifty are a
long walk.

| Event                     | 0–99 | 100–199 | 200–255 |
| ------------------------- | ---- | ------- | ------- |
| A level taken             | +5   | +3      | +2      |
| 256 steps walked as buddy | +2   | +2      | +1      |
| A bitter berry eaten      | +10  | +5      | +2      |
| Herbal medicine, per dose | −5   | −5      | −10     |
| Knocked out               | −1   | −1      | −1      |

A caught pokemon starts at 70; a hatched one starts at 120, because it has
already been carried.

A pokemon caught in a **Luxury Ball** gains twice as much from every source for
its whole life. The doubling applies to gains and never to losses.

A **groomer** adds half of whatever friendship is left to give. That is worth a
great deal to a pokemon fresh out of a ball and almost nothing to one that is
already inseparable, and since it is always half of the remainder it can never
buy the last of a friendship. See [People you meet](npcs.md).

Friendship does not survive a sale. A pokemon bought at auction begins again at
70 for its new trainer, so gold buys the pokemon but never the walking behind it.
A lot that goes back unsold keeps what it had, having never changed hands.

## Bottle caps

A pokemon's individual stats are rolled once, before it is ever met, and nothing
else in the game changes them. That is what makes a poor roll on an
already-raised pokemon worth an item of its own.

| Item                  | Rarity  | Effect                                         |
| --------------------- | ------- | ---------------------------------------------- |
| **Golden Bottle Cap** | Special | Raises every stat to perfect                   |
| **Bottle Cap**        | Prized  | Raises one stat, drawn from the imperfect ones |

The stat a plain cap lands on is not the player's choice — otherwise it would not
be a cap. It never lands on a stat that was already perfect, and a pokemon that
is perfect all round is refused before it can waste one.

Both caps are found in the overworld and nowhere else; no shop stocks either.

## Purifying a shadow

A shadow pokemon comes from a shadow raid or from a Team Rocket grunt. It keeps
the **Shadow** ability permanently and costs **double candy** at every level.

Two things undo that: a **Purifying Gem**, which is a prized find, and **Nurse
Joy**, who does it free of charge along with her healing.

A purified pokemon costs ordinary candy again, gains **+2 to every individual
stat**, and is marked Purified. The mark is cosmetic and changes nothing in
battle: purifying changes what a pokemon costs, not what it was.

## Teaching a move

Three things change what a pokemon knows after it has been obtained:

- **Growing into a move.** When candy takes a pokemon to a level its species
  learns something at, that move is offered. It costs nothing; the candy already
  paid for it.
- **A technical machine.** There is one machine per teachable move, and it works
  on any species able to learn it.
- **The Move Reminder**, who restores a move the pokemon learned by levelling and
  has since lost. His price is one **Heart Scale**, which is dug out of the ground
  and which no shop buys or sells. See [People you meet](npcs.md).

A pokemon that knows fewer than four moves simply learns another; one that
already knows four must forget one, chosen by the player. Nothing is ever spent
on a move that was not learned.

Four cases are refused: a move that source cannot teach, a move the pokemon
already knows, an egg, and a pokemon locked into a live battle.

The Move Reminder restores only **level-up** moves, so a machine move given up to
make room is gone for good, and the choice of what to forget stays a real one.

### Why only the current level

A level-up move is offered for the level a pokemon is standing on and no other.
Nothing records whether the offer was accepted or declined, so a player may
change their mind right up until the next candy takes the pokemon past that
level. After that a Heart Scale is the only route back.

If growing up offered everything a pokemon could have learned by then, it would
amount to a free Move Reminder and the Heart Scale would be worth nothing.

## Healing

- **A berry** restores or cures exactly what it does in a fight, so an Oran Berry
  is worth ten points on either side of one. Out of battle the player decides
  when it is worth using.
- **Medicine**, off the shelf below. **None of it can be held**, so nothing is
  drunk mid-raid, which is what keeps berries worth carrying into one.
- **Herbal medicine**, cheaper and stronger, paid for in friendship rather than
  in gold. Stronger preparations count as more doses, and a Luxury Ball does not
  soften the loss. It is a straight choice between a party put right today and a
  pokemon that adores its trainer in a month.
- **A level**, which heals as a side effect.
- **A Heal Ball thrown at something else**, which restores the buddy for free.
  See [Catching](catching.md#balls).

| Medicine                        | What it does                                            |
| ------------------------------- | -------------------------------------------------------- |
| **Potion, Super, Hyper, Max**   | 20 points, 60, 120, and all of it                        |
| **A cure, Full Heal**           | One status, or every one at once                         |
| **Full Restore**                | Health and every status together                         |
| **Revive, Max Revive**          | A fainted pokemon, on half its health or all of it       |
| **Energy Powder, Energy Root**  | 50 points and 200, for friendship                        |
| **Heal Powder, Revival Herb**   | Every status, or a faint on full health, for friendship  |

Two rules apply throughout. **A revive is the only thing that reaches a fainted
pokemon**, and the only thing that does nothing for one still standing. And
**anything that would change nothing is refused rather than consumed** — the
wrong cure, or a pokemon already at full health.

A fainted pokemon cannot fight. A raid refuses a party containing one, and a
party of fainted pokemon cannot start a battle at all.

## Held items

A pokemon holds **one** item at a time, and only items meant to be held. A
**Utility Belt** — a prized find, spent on use — gives one pokemon a second slot
permanently.

That single slot is what makes the held items a genuine choice: a Shiny Charm, an
Exp. Share, a Lucky Egg, a Luck Incense, a Pure Incense and an Amulet Coin all
want the same slot on the same buddy — and a berry or a piece of battle gear
wants it during a raid.

## Abilities

A pokemon's ability is decided before you ever meet it, and most carry exactly
one. Nothing you own can change it.

The **Channeler**, one of the people who wander, is the single exception. For one
Heart Scale she opens a second ability slot and fills it at once, drawing from
everything the pokemon's family is capable of. Which ability answers is hers to
decide. Ask her again on a later window and the pokemon widens again, until
either its family has nothing left it does not already carry or it runs out of
room.

Most Kanto families hold **three** abilities or fewer between all their stages,
so a pokemon usually stops at two or three. The Eevee line is the deepest by far.
Being a shadow, a purified pokemon or a raid boss costs no room: those marks ride
alongside the abilities rather than taking a slot from them.

## See also

- [Eggs](eggs.md)
- [Items and gold](items.md)
- [Battles](battles.md)
