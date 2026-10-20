# Catching

Overwander has no wild battles. Meeting a pokemon opens a **safari session**, in
which the player throws balls, feeds berries or walks away. Every action costs a
turn, every failed throw risks the pokemon fleeing, and the session ends in one
of three ways: caught, fled, or left alone.

## The session

The dialog shows the species, level and gender at the top, the pokemon itself in
the middle, and three buttons at the bottom: **Run**, **Throw** and **Bag**.

- **Throw** sends whatever is in hand. A ball is a catch attempt, and a berry is
  fed to the pokemon.
- **Bag** opens the bag filtered to balls and berries. Choosing a ball sets
  what the session throws from then on; choosing a berry puts it in hand for the
  next action only.
- **Run** walks away. Nothing is lost by it: see [Fleeing](#fleeing).

A session opens on the last ball the player threw, while any are left. The
**Keep the last ball** setting turns this off, and then a session opens on a
Poke Ball. A player carrying neither starts on the first ball in the bag.

No odds are displayed. The catch chance, the flee chance and the feeding bonus
are all live and all hidden, on the principle that a player deciding whether a
pokemon is worth their remaining Ultra Balls should be looking at the pokemon.
What it is actually worth, its stats and nature and ability, is discovered by
catching it. A few buddies tell a little more: see
[What a buddy changes](encounters.md#what-a-buddy-changes).

The one thing the game does say is the ball itself. See
[Shakes](#shakes).

## Shakes

A thrown ball rocks up to three times, and it has to hold through all three.
Each shake is its own check at the same odds, so three of them multiply back to
exactly the catch chance below: the shaking is the roll, not a picture of one.

That makes the rocking the only honest thing a player is told about the odds.
Two shakes and a burst means the throw came close. None at all means it was
never going to hold, and something in the bag should change before the next one.

### A critical throw

Some throws come out **critical**: the ball rocks once and holds. The single
shake is at the same odds as any other, so a critical throw is far likelier to
catch, which is why it is rare.

How often one happens depends on how full the player's pokedex is. A trainer who
has caught nothing never throws one; the chance climbs in bands from thirty
species owned to six hundred, and it also rides the throw's own chance, so a
critical throw at a Chansey with a Poke Ball is still nearly hopeless. It can
never happen more than 15% of the time. A **Super Luck** buddy doubles it.

**Sniper** is the other half: critical throws come no oftener, but the single
shake behind one gets two chances instead of one, the better deciding. Walking
with both means more critical throws and better ones.

Nothing about a critical throw changes what is caught, and it is announced only
after the fact.

## Catch chance

Seven things multiply together to decide whether a thrown ball sticks:

| Factor                    | What it is worth                                                    |
| ------------------------- | ------------------------------------------------------------------- |
| **The species**           | Its mainline catch rate: a Caterpie comes along, a Chansey does not |
| **The ball**              | Up to eight times, and a Master Ball never fails                    |
| **The berries** fed       | 25% more each, stacking to four times at most                       |
| **The species day**       | Double for a pokemon of the featured family                         |
| **The level**             | Falling evenly to 45% of its easiest at level 100                   |
| **A shadow**              | Half. See [Shadows](#shadows)                                       |
| **What the buddy brings** | Half again for a Catching Charm or a matching ability               |

An eighth, much smaller factor rewards persistence at one pokemon; see
[Persistence](#persistence).

The buddy's share is half again on every throw for one holding a **Catching
Charm**, a prized find on the ground. A buddy with **Lightning Rod**, **Motor
Drive**, **Volt Absorb**, **Storm Drain**, **Water Absorb**, **Sap Sipper** or
**Flash Fire** puts half again on a throw at a pokemon of its own type.

### Shadows

A shadow pokemon is **half as likely to be caught** as the same pokemon would be
otherwise. A closed heart does not want to be held, and it is the one thing
purifying puts right.

The penalty is flat rather than scaling, because the reason has nothing to do
with the species or its level: the same thing is wrong with every shadow. It
multiplies with everything else, so a better ball buys exactly what it always
bought. A buddy with **Purified** softens it: a ball thrown at a shadow beside
one holds half again as often. Nothing a shadow was given is taken away by it either, and a shadow that
was fought for rather than found, such as a grunt's parting gift or a raid prize,
still never flees, so the only cost is balls.

### Level

There is no health bar to wear down, because nothing is fought before it is
caught. Level stands in for it instead. A level 1 pokemon is at its easiest to
catch, and the chance falls evenly to **45%** of that at level 100.

Level scales everything else rather than replacing it, so a species that was
easier to catch remains the easier of the two at any level. A level 38 Gyarados
works out at roughly a **14%** chance per Poke Ball, against 17.6% if its level
had not been counted.

### Balls

There are twenty-two balls, and most only help under the right conditions. The
condition is tested at the moment of the throw rather than when the ball was
chosen.

| Ball                               | Bonus    | Condition                                  |
| ---------------------------------- | -------- | ------------------------------------------ |
| **Master Ball**                    | Certain  | Always; never fails                        |
| **Quick Ball**                     | ×5       | The first turn of the session only         |
| **Beast Ball**                     | ×5       | An Ultra Beast; anything else ×0.1         |
| **Net Ball**                       | ×3.5     | Bug and Water types                        |
| **Dive Ball**                      | ×3.5     | Water biomes                               |
| **Repeat Ball**                    | ×3.5     | A species the player already owns          |
| **Timer Ball**                     | up to ×4 | Grows each turn, reaching its cap near ten |
| **Nest Ball**                      | up to ×4 | Low levels; nothing from level 31 up       |
| **Dusk Ball**                      | ×3       | Evening and night                          |
| **Ultra Ball**                     | ×2       | Always                                     |
| **Great Ball**                     | ×1.5     | Always                                     |
| **Poke / Premier / Heal / Luxury** | ×1       | Always                                     |

The **Beast Ball** is not sold. It turns up on the ground as an uncommon find,
and it is the one ball that makes a throw worse than a Poke Ball: it is for the
eleven Ultra Beasts and nothing else.

**Kurt's seven** are carved from apricorns rather than bought, and turn up on
the ground as scarce finds. Each answers something the shop balls cannot. See [People you meet](npcs.md).

| Ball             | Bonus    | Condition                                        |
| ---------------- | -------- | ------------------------------------------------ |
| **Level Ball**   | up to ×8 | Something far below the buddy walking beside you |
| **Love Ball**    | ×8       | The buddy's own species, opposite gender         |
| **Lure Ball**    | ×5       | Something startled out of rippling water         |
| **Moon Ball**    | ×4       | Any member of a line a Moon Stone evolves        |
| **Fast Ball**    | ×4       | A species with 100 base Speed or more            |
| **Heavy Ball**   | up to ×4 | By weight, from 2x at 100 kg                     |
| **Friend Ball**  | ×1       | Catches like a Poke Ball                         |

A **Friend Ball** is worth throwing for what happens afterwards: what it holds
arrives at **200 friendship**, which is most of the way to inseparable. A shadow
is the exception: it arrives at nothing, whatever the ball.

The Premier, Heal and Luxury Balls catch exactly like a Poke Ball. Two of them
are worth throwing for what happens afterwards:

- A **Heal Ball** restores the pokemon walking beside the player: full health and
  every status cleared, at no cost. Nothing happens if the buddy is already
  healthy, is an egg, or is locked into a live battle.
- A **Luxury Ball** makes the pokemon caught in it gain friendship **twice as
  fast** for the rest of its life. See [Friendship](training.md#friendship).

The Premier Ball is commemorative and nothing more.

### Changing a ball

A pokemon can be moved into a different ball at any time, unless it is an egg or
locked into a live battle: open its sheet, choose **Use item**, and pick a ball
out of the bag. The ball is spent, and the one it
was in is gone.

Mostly this is for how a pokemon looks in its records, but a Luxury Ball is worth
moving into, because the friendship bonus follows whatever ball the pokemon is
in now rather than the one it was caught in. What a ball did at the moment of the catch does
not come back: putting a pokemon in a Heal Ball today heals nobody.

The record remembers regardless. Each line of a pokemon's history shows the ball
it was in when that owner received it, so a Beedrill caught in a Dusk Ball still
says so after it has been moved.

### Berries

Ten berries may be fed, each worth **25% more** catch chance. They stack
multiplicatively up to a total of **four times** the original chance, so four
berries is nearly everything feeding can achieve and a fifth is close to wasted.
A buddy with **Gluttony** raises that cap by half again, to six times.

The ten are the five single-status cures (Cheri, Chesto, Pecha, Rawst and Aspear)
together with Leppa, Oran, Persim, Lum and Sitrus. All are everyday berries,
which makes feeding one a real decision against saving it for a fight.

Fourteen more exist and are worth **50% more** each, since they are bait and
nothing else: Razz, Bluk, Nanab, Wepear, Pinap, Cornn, Magost, Rabuta, Nomel,
Spelon, Pamtre, Watmel, Durin and Belue. They grow in berry patches among the
commonest fruit, so a patch is as likely to bear bait as a cure.

### Prize berries

Three of those fruits also grow silver and gold, in the rarest band a berry patch
has. Each family buys a different thing, and every one of them is bait first, so
feeding one is never worse than feeding the plain fruit.

| Berry            | What feeding one buys                           |
| ---------------- | ----------------------------------------------- |
| **Silver Razz**  | Twice the catch chance                          |
| **Golden Razz**  | Three times the catch chance                    |
| **Silver Nanab** | Halves its chance of bolting from the next ball |
| **Golden Nanab** | It will not bolt from the next ball at all      |
| **Silver Pinap** | Catching it pays double candy                   |
| **Golden Pinap** | Catching it pays triple candy                   |

A gold Razz on its own is most of the four times feeding can ever reach, so
there is little point stacking anything on top of one.

The two Nanabs last for **one throw**, the same as any treat, unless the buddy
has **Harvest**, which keeps a treat working after a missed throw. A Pinap is
different: it rides the meeting rather than the throw, so once one is fed the
extra candy is paid whenever the pokemon finally goes in a ball, however many
balls that takes. Only the latest treat counts, though: feeding anything after a
Pinap gives up its candy.

Feeding costs a turn, which is what stops it being free. It advances the Timer
Ball's clock and spends the Quick Ball's opening, and it is a berry that could
have gone into a fight. Feeding never makes a pokemon bolt: only a failed ball
does that.

**Only one berry at a time.** A pokemon that has been fed accepts nothing further
until a thrown ball **misses**, so the bag cannot be emptied into it before the
first throw. The resulting rhythm is feed, throw, feed, throw.

## Fleeing

Every ball that fails to catch gives the pokemon a chance to bolt. What decides
it is that individual's **own Speed**. Its level, its individual stats and its
nature all count, not merely its species' reputation. Effort training is not
counted, since nothing wild has trained.

A young pokemon is therefore easy to catch _and_ easy to hold on to, while a
fully grown fast one is neither. Even the fastest pokemon flees at most half the
time, so nothing is impossible to keep. A Nanab or the right buddy brings that
down further: see [Prize berries](#prize-berries) and
[What a buddy changes](encounters.md#what-a-buddy-changes).

Three pokemon never flee: a **raid prize** of any kind, the pokemon a **beaten
Team Rocket grunt** hands over, and one that arrives as a **gift**. The first two were
already fought for, and the third was set aside for you. A gift that could run
off would be a gift taken back. A gifted pokemon is also caught by the first ball
that reaches it, whichever ball that is: the throw is a formality, and the ball
you use is the one the record ends up naming.

A pokemon that flees cannot be met again. Walking away is different: a wild one
remains standing there until its five-minute window turns over, and may be tried
again. A raid prize, a grunt's pokemon or a gift left uncaught waits for the
player however long they take, and is offered again.

Coming back picks up where the player left off. The berries already fed, the
balls already thrown, the Timer Ball's clock and the spent Quick Ball opening
are all remembered for that pokemon.

## Persistence

Every ball already thrown at a pokemon makes the next one worth about **1% more**,
compounding. It amounts to little at first and then adds up: ten balls in, a
throw is worth a tenth more than the first; seventy balls in, twice as much.

It never rescues a hopeless attempt, since a Mewtwo would take hundreds of balls
before the effect mattered. A long, stubborn session genuinely does improve
rather than merely feeling unlucky.

How many balls a player is carrying changes nothing at all. A full bag throws
exactly like an almost-empty one.

## See also

- [Meeting pokemon](encounters.md)
- [Items and gold](items.md)
- [Raising a pokemon](raising.md)
