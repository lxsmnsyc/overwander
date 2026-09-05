# Battles

Battles in Overwander are fought in **real time** rather than in turns. Each
pokemon winds up a move, the move lands, and that move then has to cool down
before it can be used again. Two pokemon with quick moves trade several times
while a third is still charging a Solar Beam.

Players do not choose moves during a fight. Each pokemon picks for itself, and
will not choose a move that would do nothing.

Fights come from five places: **raids** at a lair, the **trainers** a walk runs
into, **Team Rocket** stops, a **gym seat** another player is holding, and a
**duel** two players opened between themselves.

## How a move resolves

| Stage           | What happens                   | How long                                      |
| --------------- | ------------------------------ | --------------------------------------------- |
| **Wind-up**     | The pokemon gathers itself     | About 1.7 seconds                             |
| **Travel**      | The move is on its way         | A quarter second, or the flight time it names |
| **Landing**     | It hits, and the effect lands  | Instant                                       |
| **Carrying on** | Multi-step moves continue      | Another wind-up per step                      |
| **Cooldown**    | That move cannot be used again | Set by the move's PP, less what Speed buys off |

**A move is in the air for a moment.** Most take a quarter of a second between
going off and landing, which is the time a swing takes. Anything thrown names its
own flight time, twice that, and is drawn crossing the field. It is a real gap: a
pokemon that faints or interrupts the attacker during it does so before the hit
arrives.

**Priority shortens the wind-up.** Each point of a move's priority takes time off
it, so Quick Attack visibly comes out faster than a slower move that started
earlier.

**PP is a rate, not a pool.** Nothing runs out during a fight. Instead a move may
be used its full PP's worth of times every three minutes: a 35 PP Tackle returns
about every five seconds, a 5 PP Hyper Beam about every thirty-six. Strong moves
are rationed by the clock.

**Speed shortens every cooldown.** There is no turn order to win in a real-time
fight, so what Speed buys is throwing the same move oftener: every 512 points of
Speed halves what is left of the wait, closing on 95% off without ever quite
getting there. A pokemon at 170 waits a fifth less than the move asks, one at 500
waits half as long, and one at 1,500 is down to a sixth. Nothing is ever wasted
on a stat that has run out of room. It is the stat as it stands at that moment,
so an Agility, a Choice Scarf, Swift Swim under rain and paralysis all show up in
how often a pokemon acts.

**A wind-up can be interrupted.** Flinching stops it, and so does the target
fainting. A move that has already landed cannot be taken back.

**Switching is a walk across the field**, not a disappearance. The pair change
places in front of everybody, the one crossing keeps winding up whatever it had
started, and anything aimed at it, a wind-up, a channel or a move already in the
air, follows the swap onto whoever took the spot. Switching out of a hit is
therefore switching somebody else into it. Only **Teleport** takes its user out
of the world: that one interrupts, stops both ends acting, and cannot be touched
while it goes.

**Some moves take several steps.** Dig spends time underground, Thrash swings
repeatedly, Teleport disappears before it leaves. Each further step takes about as
long as the original wind-up.

### Move selection

A pokemon will not spend a wind-up on a move that resolves to nothing: an immune
target, a status the target already has, Dream Eater against something awake,
Counter with no hit to return, and so on. A wind-up costs time, a cooldown and an
opening, and a failed move spends all three.

In a **raid**, a party favours buffing itself early, because against a health
pool that size the first few moves are better spent making the rest count. The
raid boss does not do this: it attacks.

**Nothing stands still.** Every pokemon fights knowing one move more than it was
brought in with: a plain **Attack**, ten power, back about once a second, and
thrown as whatever the pokemon is. A Charmander's swing is Fire, a Geodude's is
Rock. Nothing teaches it and it is in no learn set; it is simply what a pokemon
does with its hands. It is far too weak to be worth choosing, which is the point:
it is what fills the gaps while the real moves cool, and it never displaces one
of them.

A pokemon shut out of its move set entirely, the swing included, **Struggles**
instead, and pays a quarter of its health for it.
Waiting on a cooldown and having nothing at all are different states, and they
get different answers.

### Animation

A pokemon **winding up** gathers itself: one gesture, repeated, for however long
the wind-up lasts. What it is about to throw makes no difference to it, since the
throw is the next part.

A pokemon **throwing** plays the closest thing to that move its sheet actually
has, fitted to the moment the move is in the air so the gesture ends as the hit
lands. Sprite sheets differ, since a Machop has a punch and a Magikarp does not, so a
Fire Punch punches on one pokemon and swings on another.

The visible result is that speed can be seen: a slow move is a long gathering,
and Quick Attack is a short one.

**A move looks like what it is.** A contact move lands as a jab, a hit, a slam or
a fist, picked by its type and its power. A guard closes in, a boost runs upward,
a drain pulls health back, sound carries across the gap, powder drifts, and a
psychic move already has hold of its target on the way over. A stat change is
drawn as chevrons on whoever moved, rising for a raise and falling for a drop,
coloured by which stat it was. Reflect, Light Screen and Safeguard put up a pane
of coloured glass over the middle of the team.

**A blow is drawn in the type that dealt it.** The mark is lit for a weakness,
drained toward grey for a resistance, and the type's own colour in between. A
move that strikes five times lands five marks, and only a move that never landed
leaves a colourless one.

Weather arrives over the field rather than over whoever called for it. In a raid
it is drawn over the side that called it, since that is the side it is doing
anything for.

None of this affects the fight itself.

## Damage

```text
damage = base damage × critical × 0.85–1.00 × type matchup × same-type bonus
```

| Part                | Effect                                                    |
| ------------------- | --------------------------------------------------------- |
| Critical hit chance | 1 in 16, raised by moves and items that sharpen it        |
| Critical hit damage | ×2, ignoring defence buffs that would have blunted it     |
| Same-type bonus     | ×1.5 when the move matches one of the user's types        |
| Type matchup        | The full type chart, applied once per type the target has |
| Random roll         | Between 0.85 and 1.00                                     |

A critical hit ignores the attacker's _lowered_ attack buffs and the defender's
_raised_ defence buffs, and nothing else, so a sweeper that has been snarled at
still lands its criticals properly.

Three things block a move outright before any of this: the type chart's own
immunities, **powder** moves against Grass types, and **Ground** moves against
anything airborne. A Flying or floating pokemon can be dragged back to earth, at
which point Ground moves reach it.

Physical moves use Attack against Defence and special moves use Special Attack
against Special Defence. A few fixed-damage moves ignore the formula entirely.

## Statuses and weather

There are twenty-two statuses. Six of them **follow a pokemon out of the
battle**: poison, bad poison, sleep, paralysis, burn and freeze. The rest,
including confusion, flinching, seeding, trapping, hiding and floating, end with
the fight. A pokemon can leave a raid both poisoned and asleep.

Statuses that chip away do so on a clock, since there are no turns. Every
**two seconds**, which is roughly one move and what a turn used to be worth:

| What is chipping | How much of the maximum it takes  |
| ---------------- | --------------------------------- |
| **Poison**       | An eighth                         |
| **Bad poison**   | A sixteenth, growing with each bite |
| **Sand, hail**   | A sixteenth, to whoever is not built for it |

A status that runs out on its own runs out on that clock too:

| Status                      | How long it lasts                         |
| --------------------------- | ----------------------------------------- |
| Flinching                   | 2 seconds                                 |
| Recharging after a beam     | 2 seconds                                 |
| Sleep                       | 4 seconds                                 |
| Confusion                   | 4 to 10 seconds                           |
| Freeze                      | 10 seconds, or until a Fire move thaws it |
| Being trapped               | 8 seconds, biting every 2                 |
| Reflect, Light Screen, Mist | 10 seconds                                |
| Weather                     | 10 seconds                                |
| A disabled move             | 8 seconds                                 |
| Perish Song                 | 8 seconds, and then whoever heard it falls |

Poison, bad poison, burn and paralysis have no clock at all: they last until
something cures them. A full-paralysis stumble costs the pokemon 2 seconds
before it may try again.

A held berry cures a status the moment it lands, before the first move is cast.

A fight met on the road is fought **under the sky that was over it**: a trainer
or a grunt standing in the rain fights in the rain, and the sky is kept with the
battle so a replay runs under the same one. Raids, duels and gym seats are fought
under a clear sky whatever the world is doing.

There are nine kinds of weather, from plain sun and rain up to the extreme forms.
In a **raid**, a pokemon that changes the weather changes it only for its own
party, unless the boss changed it, in which case it applies to everybody.
Otherwise one player could impose rain on a lobby of strangers.

## How a fight ends

A fight ends as soon as it can go nowhere: nothing is mid-move, and no surviving
pokemon can act against an enemy. That covers the awkward cases, such as a side
that is alive but permanently unable to do anything.

| Situation                           | Result                                                                  |
| ----------------------------------- | ----------------------------------------------------------------------- |
| One side still standing             | That side wins                                                          |
| Nobody standing, in a raid          | The party wins. A boss taken down with the last of the party is beaten |
| Nobody standing, anywhere else      | A draw                                                                  |
| Both sides standing, nobody can act | A draw                                                                  |

The result appears in a dialog the moment the fight settles, naming the outcome
and what it was worth. Closing it leaves the player standing on the finished
field. Nothing depends on pressing the button: rewards are already granted, and
the result remains on the page.

## Raids

A raid is a party of players against a single **boss**. It is staged by a
**lair**, which is a place rather than a pokemon: the lair decides who lives in
it, and the raid is named after the place, so two Articuno raids in one chunk
carry different names.

A lair can hold more than one resident, and the raid rolls which of them is at
home. The **Burned Tower** is the one that does: Raikou, Entei and Suicune all
live there. The rest hold one legendary each, at the **Seafoam Islands**, the
**Power Plant**, **Mt. Ember**, **Cerulean Cave**, the **Whirl Islands** and the
**Bell Tower**. **Faraway Island**, the **Ilex Forest**, **Forina** and
**Birth Island** hold the mythicals, and no walk ever stages those.

A lobby stands for the whole three-hour raid window and anyone may join it; the
host starts it. Each player brings up to **six** pokemon, and a lobby holds
**twenty players**. Somebody fielding two parties still fills one place, and
anybody may stand there and watch without a party at all.

The boss may be defeated **once per window**, not fought once: clearing it closes
the lair until the next window. A raid that is lost, or left unfinished for ten
minutes, restages in place with a new host.

A **mythical raid** is not staged by the world at all. It is called out by
spending a relic, and the world never produces a mythical on its own. There are
four: an **Old Sea Map** calls Mew to the island it names, a **GS Ball**
calls Celebi to the shrine in the forest it was left at, a **Wish Tag** calls
Jirachi to the valley the comet passes over, and an **Aurora Ticket** calls
Deoxys to the island it admits one passenger to.

A **shadow raid** usually stages one of the biome's rare species, but one time in
eight it reaches past them and stages a legendary instead.

### The raid boss

A boss is a **maxed legendary, perfect in every individual stat and trained to
the cap in every one**, and every player
in the lobby fights exactly the same one. Its raid form gives it:

- A raid-sized health pool: twenty times what the species would have had.
- Double every other stat.
- Wind-ups that take twice as long, and that nothing short of fainting can
  interrupt.
- Single-target moves that strike every enemy at once.
- Immunity to attempts to lower its stats.

A boss opens the fight **dormant**: for the first ten seconds it stands there and
cannot act, which is the party's window to arrive, buff up and land the opening
hits. Sent out again later in the same fight, it skips the warm-up.

It shrugs off everything that would take the fight away rather than make it
harder, such as sleep, freeze, flinch, trapping and infatuation, unless it did it to
itself, so a boss that uses Rest really does sleep. **Perish Song** is the same
case at its most extreme: a boss never hears it, its own singing included, and
nobody sings it in a raid at all, since the only side left counting would be the
party. Infatuation is excluded twice
over: a large lobby always contains somebody the boss would fall for, and a
landed Attract would turn the raid into a queue.

**Indirect damage counts, up to 100 a time.** Poison, burns, seeds, weather and
crash damage from a missed Jump Kick all chip at a boss, and none of them chips
for more than 100 however large the pool is. Damage measured as a share of its
health, such as Super Fang, is refused outright. A cost the boss pays itself is
paid in full, so one that uses Explosion still dies by it.

**A boss heals an eighth of its pool a second.** Recover, Synthesis and the rest
are moves it may know again, and the allowance is what it can take back in a
second rather than per heal, so several drains landing together are worth one of
them. It refills as the fight runs, so a boss winds the clock back without
resetting it. Rest stays barred: the sleep it buys is self-inflicted, so it lands
in full while the healing does not.

Four moves are removed from a boss before it is staged. **Transform** is banned
because a boss that copies a player stops being a boss, throwing away the health
pool the fight is built around, and **Metronome**, **Mirror Move** and **Mimic**
follow it because each is a route back to Transform. **Ditto** is never staged as
a boss at all.

## Team Rocket

Somebody from Team Rocket stands at their cell for three hours at a time, and
which of them it is turns over with the window; see [People you meet](npcs.md).

All three ranks field six shadowed pokemon of that biome's own, each rolling its
own level, and what changes is where the six come from and how hard they hit. A
**grunt** brings one common, two uncommon and three rare at **40-60**. An
**executive** brings six of the rare band at **65-85**, which is where the Elite
Four stand. **Giovanni** brings five of the rare band and a legendary at
**85-100**, which is where a Champion stands.

It is an ordinary trainer battle whoever is standing there: neither side is a
boss, so a simultaneous knockout is a draw.

Every player fights the cell separately. Winning closes nothing for anybody else,
and losing costs nothing but the attempt. They are still there and may be fought
again until the window turns over.

### What an expert's party carries

A duelling trainer and a Team Rocket grunt field what they caught. Everybody
above them fields pokemon that were **trained**, which is most of what makes the
same six harder from their side of the field:

| Whose party        | Abilities | Held items | Individual values | Training |
| ------------------ | --------- | ---------- | ----------------- | -------- |
| Trainer, grunt     | 1         | None       | Rolled, like anything wild | None |
| Ace Trainer        | 1         | None       | Perfect HP and Speed, the rest rolled | 252 in those two, 50 in the rest |
| Gym leader         | 1         | 1          | A flat 10 in every stat | 50 in every stat |
| Elite Four, executive | 2      | 1          | Perfect HP and Speed, the rest rolled | 252 in those two, 50 in the rest |
| Champion, Giovanni | 2         | 2          | Perfect HP, Speed and its better attacking and defending stat, the rest rolled | 252 in those four, 50 in the rest |
| Legend             | 3         | 3          | Perfect, all six | 252 in every stat |

Which stats an expert polishes is read off the species rather than picked: HP and
Speed first, since every party wants to move first and stay standing, then the
attacking and defending side its own spread already leans on, so a Steelix is
raised to take physical hits and an Alakazam to take special ones. A type expert and a grunt have had nothing
spent on them, and a gym leader's flat 10s are **below** what a lucky roll gives,
so the ladder's early rungs are beatable on a good catch alone. An **Ace Trainer**
is the exception on the road: they bring no gear and no second ability, but their
six are raised the way the Elite Four's are, which is why they hit above the cell
they stand on.

Above them it is not. An expert is trained past what the five-points-a-level
budget would ever allow a player's own pokemon, which is the ladder's answer to a
player who breeds and trains: see [Raising a pokemon](raising.md) for what that
budget is.

What a Team Rocket prize is worth is untouched by any of this. The pokemon handed
over is the one the roll made, values and all, not the one that was raised to
fight.

### How a built party is put together

The Elite Four and everybody above them do not field what they caught: their six
are **built**, and built as a party rather than as six separate pokemon.

**Two cores and four supports.** The two whose own stats say they can take
something off the field are handed that job, and the other four are there to keep
the cores standing and the far side hampered. Which two are cores is read off the
species, not the slot, so the hitter in the party is the one that hits.

The job reaches everything about a pokemon that is chosen rather than rolled:

- **Moves.** A core is built around attacks and the setup that sharpens them. A
  support gives up to half its sheet to health, screens, hazards and whatever
  cripples the other side, and always keeps two ways to hurt somebody. Four
  supports are built knowing what the rest of the party already brings, so a
  league team does not lay the same screen four times.
- **Friendly moves.** Every fight here stands the whole party up at once, so a
  move aimed at a teammate has somebody to aim at. A support will spend a slot on
  a Helping Hand or a Follow Me for the cores in front of it, and passes a Baton
  only when it has something raised to pass. A core never does: a cast spent on
  somebody else's hit is a cast it did not take itself.
- **Synergy.** Moves are picked knowing what else is on the sheet: a Substitute
  makes room for the Focus Punch behind it, a Rest for the Sleep Talk, and a Dream
  Eater is never brought without something to put the target to sleep.
- **No two the same.** A move somebody else already carries is worth less to the
  next pokemon, and less again to the one after, so a party does not answer one
  wall with four Earthquakes. A move a pokemon gets its own type bonus from is
  barely docked: three Dragon types all carrying a Dragon Claw are three pokemon
  casting what they are best at.
- **One sky for the six.** The weather is the party's decision, not each
  pokemon's. If anybody brings a Drought or a Drizzle, that settles it and nobody
  spends a slot on the setter. If nobody does but somebody is waiting on a sky, a
  Chlorophyll or a Swift Swim, exactly one member carries the Sunny Day or the
  Rain Dance, a support where one can learn it, and the other five spend their
  slots on what the sky is worth to them: Solar Beams that stop winding up, a
  Thunder that stops missing, Fire and Water moves worth half again.

  A sky has to pay for itself, and **the cores decide**. What a core gains or
  loses under it counts double what a support's does, since the cores are what the
  party is trying to win with. Red's cores are a Chlorophyll Venusaur and a Solar
  Power Charizard, so his six fight under sun even though two Water pokemon stand
  behind them; put the same want on a support and a Fire core in front of it, and
  no sky is called at all. An ability waiting on a sky that is not coming is not
  awakened either: a Charizard on a rain team keeps Blaze and Intimidate rather
  than a Solar Power that would never fire.
- **Abilities.** The ones it awakens are the ones the job wants, out of everything
  its species could ever carry: what sharpens a hit for a core, what survives one
  for a support. They are priced against the sheet it ends up with, so nothing
  awakens a Reckless with no recoil move to lift, a Strong Jaw with nothing that
  bites, or a Solar Power under a sky that is not coming.
- **Nature.** The 10% goes on the stat the sheet actually uses and comes off the
  one it never casts from, so a Machamp is handed the opposite nature to a Gengar
  without either being written down.

A gym leader and everybody below still field what a walk could have met, which is
the difference between a badge and a crown.

**Gear follows the job too.** A Life Orb buys damage with the holder's own
health, a tenth of it per blow that lands, so it goes to the cores: a support
pays the same price without doing the attacking that earns it back, and a fast
pokemon pays it far oftener than a slow one because Speed buys cooldown. A Choice
item is priced against how much of the sheet it locks away, so nothing carrying
two quiet moves is ever handed one.

A second ability is the one thing a player cannot get by catching the same
species: a wild meeting rolls one and keeps it. The gear is the pokemon's own
rather than the trainer's, so a Pikachu on any team holds the Light Ball because
it is a Pikachu. It is chosen from what that species is worth carrying, so a
half-grown one an expert is known for gets the item that answers being
half-grown. A legend hands out three apiece, which is deeper than most species'
own gear goes, so the slots nothing of its own fills are filled with gear that
suits anybody.

Team Rocket's prizes keep what was put into them. An executive's pokemon walks
away with **both its abilities**, and Giovanni's with both and the **room for a
second held item**, which nothing else outside a Utility Belt hands over.

## Trainers and the league

Every other fight a walk can find is fought the same way, and what changes is who
is standing there and how hard they hit. Each pokemon rolls its own level inside
its side's band, so a party has a spread rather than a rank. Which type expert is
standing at a trainer cell depends on the country; see
[People you meet](npcs.md).

| Who                   | What they field                      | Levels |
| --------------------- | ------------------------------------ | ------ |
| **Type expert**       | Three to five of their own type      | 40-60  |
| **Team Rocket grunt** | Six shadows: one common, two uncommon, three rare | 40-60 |
| **Gym leader**        | Five of their gym's type, and their signature sixth | 45-65 |
| **Ace Trainer**       | Five fully-grown pokemon of any type | 60-80  |
| **Rocket executive**  | Six shadows of the biome's rare band | 65-85  |
| **Elite Four**        | Five of their own kind, and their signature sixth | 65-85 |
| **Giovanni**          | Six shadows, one of them a legendary | 85-100 |
| **Champion**          | Their own signature six              | 85-100 |
| **Legend**            | Their own signature six              | 100    |

## Gym seats

A **gym seat** is a cell somebody else's party is standing on. It is the one
place in the world where a walk runs into another player rather than into
something the world rolled, and unlike everything else staged in a chunk it
belongs to whoever last took it rather than to a window: a seat is held until
somebody takes it off them.

**Sitting down** leaves a frozen copy of the party behind, up to six pokemon.
The originals stay the holder's to raise, fight and trade; what a challenger
fights is the copy, exactly as it stood when its owner sat down.

**Challenging** stakes gold on the outcome:

- The loser pays the winner **a tenth of their purse**, capped at 60,000 a
  fight, and never more than they hold.
- A challenger may strip at most **three good wins' worth** off one seat in a
  rolling day. A holder's takings are not capped: they did not choose the fight.
- A settled challenge bars that challenger from the same seat for **half an
  hour**.

**Winning empties the cell rather than handing it over.** The challenger takes
the purse and the seat opens; they then sit down on it like anybody else, with
whatever their party has left after the fight. The trainer they beat is barred
from their own seat for **an hour**, or until somebody else sits down, whichever
comes first.

A seat that turns a challenger away counts the stand: a holder's **defences** are
what the cell brags about, and they reset when the seat changes hands.

Only the **challenger** carries a gym fight out with them: their party keeps the
health it has left and the statuses it picked up. The holder settles nothing,
since what fought was a copy and they were not there.

## Duels

Two players may also fight because they both chose to. A **battle lobby** is
opened by a player, filled by invitation, and private to the people in it. Both
fighters bring up to six pokemon and both have to be ready before the host may
start; everyone else in the lobby watches.

A duel is a plain trainer battle. It **costs nothing and pays nothing**: no
gold, no pokemon, and no wear carried out afterwards. See
[Battle lobbies](duels.md).

Raid lobbies take onlookers too. Anybody may walk up to a lair and watch, and a
player who owns no pokemon can do nothing else.

## Costs and rewards

A battle leaves a party as it found it. Lost health, eaten berries and carried
statuses all persist into the next fight, which is what makes a party something to
look after rather than a row of levels.

The purse climbs with the fight. It is read against the **valuables**, which are
the only prices the world sets rather than a shopkeeper: a nugget off the ground
sells for 10,000, so nothing worth beating pays less than tripping over one.

| Fight                 | Gold                         | What else                                |
| --------------------- | ---------------------------- | ---------------------------------------- |
| **Duelling trainer**  | 5,000 to 15,000              | Nothing: they keep their party           |
| **Ace Trainer**       | 25,000 to 60,000             | The same                                 |
| **Team Rocket grunt** | 5,000 to 15,000              | One of the three it was not fighting with, at level 10 |
| **Rocket executive**  | 40,000 to 90,000             | Any one of their six, and an item they were carrying |
| **Giovanni**          | 120,000 to 250,000           | Any one of his six, the legendary included |
| **Gym leader**        | 20,000 to 50,000             | Their badge, and a machine of their type |
| **Elite Four**        | 50,000 to 110,000            | Their mark, and an item                  |
| **Champion**          | 150,000 to 300,000           | The league's title, and an item          |
| **Shadow raid**       | 35,000                       | A shadow, at level 25                    |
| **Legendary raid**    | 80,000                       | The legendary, at level 50               |
| **Mythical raid**     | 200,000                      | The mythical, at level 30                |
| **Gym seat**          | A tenth of the loser's purse | The cell, if you want to sit on it       |
| **Duel**              | Nothing                      | Nothing                                  |

The item an executive, one of the Elite Four or a Champion leaves is drawn from
the same pool the ground hides things in, weighted higher the further up the
ladder the fight is. **Nothing there reaches the rarest band**: a Master Ball or
a Shiny Charm stays something the world hides, because a champion's seat can be
fought again every window and a find of a lifetime handed out that often is
neither.

A raid pays everyone the same: the boss decides the purse, not who landed the
last hit. Everything else **rolls its own purse per winner** inside the range
above, so no two wins are quite alike and the same trainer is worth a different
amount to the next player. A **Luck Incense** on the buddy doubles a purse and an
**Amulet Coin** trebles it, wherever the gold comes from.

Rewards wait to be claimed, so leaving early costs nothing. An award is earned
once and kept for good, though the shelf counts every later win.

While a fight is live, every pokemon in it is **locked**: it cannot be levelled,
evolved, given an item, traded, auctioned or entered into a second raid. The lock
lifts when the fight ends, and in any case ten minutes after it started, so a
closed tab never holds a party indefinitely.

## See also

- [Raising a pokemon](raising.md)
- [Items and gold](items.md)
- [Battle lobbies](duels.md)
- [The battle engine](../engine.md): how the engine works internally
