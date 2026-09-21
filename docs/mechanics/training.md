# Training a pokemon

Four things a trainer decides after the catch: how a pokemon evolves, where its
training points go, how much it likes you, and what it knows.

## Evolution

Only evolutions the game can verify are offered. The rest are never offered
rather than being waved through.

| Method                          | Supported | Notes                                                 |
| ------------------------------- | --------- | ----------------------------------------------------- |
| **By level**                    | Yes       | Checked against the pokemon's level                   |
| **Using an item**               | Yes       | The stone is consumed                                 |
| **Holding an item**             | Yes       | Held at the moment of evolving                        |
| **By trade**                    | Yes       | A pokemon that changed hands as what it is            |
| **By friendship**               | Yes       | The three Kanto babies ask for 220                    |
| **By time of day**              | Yes       | An Espeon by day, an Umbreon by night                 |
| **By one stat against another** | Yes       | A Tyrogue at level 20, its Attack against its Defense |
| Weather, party, place           | No        | Nothing stores the answer, so it is never offered     |

A **trade evolution** opens the moment a pokemon changes hands, and what it
opens is the evolution of whatever the pokemon was at that moment. A Machoke
that was traded is a Machamp waiting to be asked. A Machop that was traded and
then grew into a Machoke is not, because nobody ever traded a Machoke: it wants
a handover of its own. The mainline evolves one during the trade itself, which
is a moment this game has nowhere to put, so changing hands opens the evolution
rather than performing it, and it stays open until it is taken.

A trade evolution that also asks for a **held item** spends it at the handover.
An Onix traded in a Metal Coat arrives without the coat and with nothing left to
ask for. An Onix nobody traded still has to hold one, and spends a **Linking
Cord** as well.

An **Everstone** refuses every evolution while the pokemon holds it. It is not
held back from anything else: it still levels, learns and fights.

Evolving preserves the individual's proportions, so a pokemon that was large for
its species stays large for its new one.

## Training points

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
Four things move them:

- **Assigning** puts unused points into a stat or takes them back out. Nothing
  is consumed, so retraining is free and reversible forever.
- **A wing** grants 3 points in its own stat _and_ raises the pokemon's budget
  by the same, so a wing adds to what there is to spend rather than spending it.
  It is the only training a pokemon ever gets that its levels did not pay for,
  and it is worth the same at level 5 as at level 100.
- **A bitter berry** removes 10 points from one stat. They return to the unused
  pool rather than being lost, and the pokemon thinks better of its trainer for
  swallowing something unpleasant.
- **A vitamin** grants 10 points in its own stat and raises the budget by the
  same, the way a wing does: an HP Up, a Protein, an Iron, a Calcium, a Zinc or
  a Carbos. One bottle is three wings and a third, and it is the only training
  gold alone can buy, off a vendor's vitamin counter.

### PP Ups

A **PP Up** raises one move's points by a fifth of what it started with, up to
three times, and a **PP Max** takes it the whole way in one bottle. In this game
that buys a **shorter cooldown** rather than more uses, since nothing runs out
mid-fight. See [Battles](battles.md#how-a-move-resolves).

It is permanent. No berry takes it back, which is why they cost more than a
vitamin, and a move already at the limit is refused rather than charged.

## Friendship

Every pokemon carries a friendship score from 0 to 255. Gains **shrink as the
score grows**: the first hundred points come quickly and the last fifty are a
long walk.

| Event                     | 0 to 99 | 100 to 199 | 200 to 255 |
| ------------------------- | ------- | ---------- | ---------- |
| A level taken             | +5      | +3         | +2         |
| 256 steps walked as buddy | +2      | +2         | +1         |
| A bitter berry eaten      | +10     | +5         | +2         |
| Herbal medicine, per dose | −5      | −5         | −10        |
| Knocked out               | −1      | −1         | −1         |

A caught pokemon starts at 70. A hatched one starts at 120, because it has
already been carried.

A pokemon caught in a **Luxury Ball** gains twice as much from every source for
its whole life. The doubling applies to gains and never to losses.

A **groomer** adds half of whatever friendship is left to give. That is worth a
great deal to a pokemon fresh out of a ball and almost nothing to one that is
already inseparable, and since it is always half of the remainder it can never
buy the last of a friendship. See [People you meet](npcs.md).

Friendship does not survive a sale. A pokemon bought at auction begins again at
70 for its new trainer, so gold buys the pokemon but never the walking behind
it. A lot that goes back unsold keeps what it had, having never changed hands.

## Teaching a move

Three things change what a pokemon knows after it has been obtained:

- **Growing into a move.** When candy takes a pokemon to a level its species
  learns something at, that move is offered. It costs nothing; the candy already
  paid for it.
- **A technical machine.** There is one machine per teachable move, and it works
  on any species able to learn it. A gym leader hands one over, and a stall that
  set up as a **machine stall** sells a dozen of them.
- **The Move Reminder**, who restores a move the pokemon learned by levelling
  and has since lost. His price is one **Heart Scale**, which is dug out of the
  ground and which no shop buys or sells. See [People you meet](npcs.md).

A pokemon that knows fewer than four moves simply learns another. One that
already knows four must forget one, chosen by the player. Nothing is ever spent
on a move that was not learned.

Four cases are refused: a move that source cannot teach, a move the pokemon
already knows, an egg, and a pokemon locked into a live battle.

The Move Reminder restores only **level-up** moves, so a machine move given up
to make room is gone for good, and the choice of what to forget stays a real
one.

### Why only the current level

A level-up move is offered for the level a pokemon is standing on and no other.
Nothing records whether the offer was accepted or declined, so a player may
change their mind right up until the next candy takes the pokemon past that
level. After that a Heart Scale is the only route back.

If growing up offered everything a pokemon could have learned by then, it would
amount to a free Move Reminder and the Heart Scale would be worth nothing.

## See also

- [Raising a pokemon](raising.md)
- [People you meet](npcs.md)
- [Items and gold](items.md)
- [Battles](battles.md)
