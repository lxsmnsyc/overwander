# Catching

Poketerra has no wild battles. Meeting a pokemon opens a **safari session**, in
which the player throws balls, feeds berries or walks away. Every action costs a
turn, every failed throw risks the pokemon fleeing, and the session ends in one
of three ways: caught, fled, or left alone.

## The session

The dialog shows the species, level and gender at the top, the pokemon itself in
the middle, and three buttons at the bottom: **Items**, **Throw** and **Run
away**.

- **Throw** sends whatever is in hand — a ball, which is a catch attempt, or a
  berry, which is fed to the pokemon.
- **Items** opens the bag filtered to balls and berries. Choosing a ball sets
  what the session throws from then on; choosing a berry puts it in hand for the
  next action only.
- **Run away** ends the session without consequence.

A session opens on the first ball in the bag rather than on a Poke Ball the
player may not be carrying.

No odds are displayed. The catch chance, the flee chance and the feeding bonus
are all live and all hidden, on the principle that a player deciding whether a
pokemon is worth their remaining Ultra Balls should be looking at the pokemon.
What it is actually worth — its stats, nature and ability — is discovered by
catching it.

## Catch chance

Five things multiply together to decide whether a thrown ball sticks:

1. **The species' catch rate**, which is the same as in the mainline games. A
   Caterpie comes along easily; a Chansey does not.
2. **The ball** that was thrown.
3. **The berries** the pokemon has been fed.
4. **The species day**, worth double if the pokemon belongs to the featured
   family.
5. **The pokemon's level.**

A sixth, much smaller factor rewards persistence within a single session; see
[Persistence](#persistence).

### Level

There is no health bar to wear down, because nothing is fought before it is
caught. Level stands in for it instead. A level 1 pokemon is at its easiest to
catch, and the chance falls evenly to **45%** of that at level 100.

Level scales everything else rather than replacing it, so a species that was
easier to catch remains the easier of the two at any level. A level 38 Gyarados
works out at roughly a **14%** chance per Poke Ball, against 17.6% if its level
had not been counted.

### Balls

Nine of the fourteen balls only help under the right conditions, and the
condition is tested at the moment of the throw rather than when the ball was
chosen.

| Ball                               | Bonus    | Condition                                  |
| ---------------------------------- | -------- | ------------------------------------------ |
| **Master Ball**                    | Certain  | Always; never fails                        |
| **Quick Ball**                     | ×5       | The first turn of the session only         |
| **Net Ball**                       | ×3.5     | Bug and Water types                        |
| **Dive Ball**                      | ×3.5     | Water biomes                               |
| **Repeat Ball**                    | ×3.5     | A species the player already owns          |
| **Timer Ball**                     | up to ×4 | Grows each turn, reaching its cap near ten |
| **Nest Ball**                      | up to ×4 | Low levels; nothing above level 40         |
| **Dusk Ball**                      | ×3       | Evening and night                          |
| **Ultra Ball**                     | ×2       | Always                                     |
| **Great Ball**                     | ×1.5     | Always                                     |
| **Poke / Premier / Heal / Luxury** | ×1       | Always                                     |

The Premier, Heal and Luxury Balls catch exactly like a Poke Ball. Two of them
are worth throwing for what happens afterwards:

- A **Heal Ball** restores the pokemon walking beside the player: full health and
  every status cleared, at no cost. Nothing happens if the buddy is already
  healthy, is an egg, or is locked into a live battle.
- A **Luxury Ball** makes the pokemon caught in it gain friendship **twice as
  fast** for the rest of its life. See [Friendship](raising.md#friendship).

The Premier Ball is commemorative and nothing more.

### Changing a ball

A pokemon can be moved into a different ball at any time: open its sheet, choose
**Use item**, and pick a ball out of the bag. The ball is spent, and the one it
was in is gone.

Mostly this is for how a pokemon looks in its records, but a Luxury Ball is worth
moving into — the friendship bonus follows whatever ball the pokemon is in now,
not the one it was caught in. What a ball did at the moment of the catch does
not come back: putting a pokemon in a Heal Ball today heals nobody.

The record remembers regardless. Each line of a pokemon's history shows the ball
it was in when that owner received it, so a Beedrill caught in a Dusk Ball still
says so after it has been moved.

### Berries

Ten berries may be fed, each worth **25% more** catch chance. They stack
multiplicatively up to a total of **four times** the original chance, so four
berries is nearly everything feeding can achieve and a fifth is close to wasted.

The ten are the five single-status cures — Cheri, Chesto, Pecha, Rawst and Aspear
— together with Leppa, Oran, Persim, Lum and Sitrus. All are everyday berries,
which makes feeding one a real decision against saving it for a fight.

Feeding costs a turn, which is what stops it being free: every turn is another
chance for the pokemon to flee, and it advances the Timer Ball's clock while
spending the Quick Ball's opening.

**Only one berry at a time.** A pokemon that has been fed accepts nothing further
until a thrown ball **misses**, so the bag cannot be emptied into it before the
first throw. The resulting rhythm is feed, throw, feed, throw.

## Fleeing

Every ball that fails to catch gives the pokemon a chance to bolt. What decides
it is that individual's **own Speed** — its level, its individual stats and its
nature all count, not merely its species' reputation. Effort training is not
counted, since nothing wild has trained.

A young pokemon is therefore easy to catch _and_ easy to hold on to, while a
fully grown fast one is neither. Even the fastest pokemon flees at most half the
time, so nothing is impossible to keep.

Three pokemon never flee: a **raid prize**, the pokemon a **beaten Team Rocket
grunt** hands over, and one that arrives as a **gift**. The first two were
already fought for, and the third was set aside for you — a gift that could run
off would be a gift taken back. A gifted pokemon is also caught by the first ball
that reaches it, whichever ball that is: the throw is a formality, and the ball
you use is the one the record ends up naming.

A pokemon that flees cannot be met again. Walking away is different: it remains
standing there until its five-minute window turns over, and may be tried again.

## Persistence

Every ball already thrown at a pokemon makes the next one worth about **1% more**,
compounding. It amounts to little at first and then adds up: ten balls in, a
throw is worth a tenth more than the first; seventy balls in, twice as much.

It never rescues a hopeless attempt — a Mewtwo would take hundreds of balls
before the effect mattered — but a long, stubborn session genuinely does improve
rather than merely feeling unlucky.

How many balls a player is carrying changes nothing at all. A full bag throws
exactly like an almost-empty one.

## See also

- [Meeting pokemon](encounters.md)
- [Items and gold](items.md)
- [Raising a pokemon](raising.md)
