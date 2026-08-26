# The world

The **world** of Overwander is a single square map, 4,096 chunks across, that is
calculated rather than stored. Its climate, its biomes, the landmarks in every
chunk and everything buried in them are all derived from one world seed at the
moment a player looks at them, so every player sees the same world without any of
it being saved anywhere.

A **chunk** is a 16×16 grid of cells and is the unit a player walks around in.
Each chunk belongs to one biome and holds a fixed set of landmarks, and its
contents refresh on several independent timers.

## Geography

### Biomes

Three qualities decide the climate of a place — how wet it is, how high it is and
how warm it is — and together they select one of the **25 biomes**, which range
from deep ocean and coral reef through savanna, desert and temperate forest to
volcano, glacier and polar ocean. Climate changes gradually, so a biome typically runs
about two dozen chunks across before giving way to another.

A twenty-sixth place, **Beyond**, exists but is nowhere on the map. Mythical
pokemon are recorded as coming from there, and nothing else does.

### Size and edges

The map is 4,096 chunks on each side, centred on the region where new players
start. At 16 cells to a chunk that is 65,536 cells from edge to edge.

The edge is a wall rather than a wrap-around: walking into it stops the player
rather than bringing them out on the opposite side of the world.

### Inside a chunk

| Area               | Size  | What may occupy it                   |
| ------------------ | ----- | ------------------------------------ |
| The whole chunk    | 16×16 | The player, walking                  |
| The placement area | 14×14 | Scenery, landmarks and pokemon alike |

The placement area sits in the middle, so a clear cell runs all the way round
the chunk: a player walking in from a neighbouring chunk always arrives on
ground with nothing on it.

Scenery and landmarks keep a clear cell on every side of them, diagonals
included: no two fixtures are ever adjacent, so there is always somewhere to
stand beside whatever a player has walked over to. Pokemon keep no such berth —
they take any cell a fixture is not standing on, and a walk goes straight
through one rather than round it. Scenery and landmarks are walked round: both
are standing there, so a route goes past them.

The three kinds are laid down in order — **scenery, then landmarks, then
pokemon** — because the first two are fixed forever and the last is rolled again
every few minutes. A window's pokemon fit themselves around the chunk rather
than the chunk being rearranged around them.

## Scenery

Every chunk carries **eight to twelve** pieces of scenery: trees, rocks, cactus,
reeds, ice — whatever its biome is made of. None of it can be pressed and none
of it does anything; it is there so a taiga looks like a taiga. Like landmarks,
scenery belongs to the chunk permanently.

## Landmarks

Every chunk contains **eight to twelve landmarks**, and they never move. The
same chunk has the same landmarks on the same cells permanently; only their
contents change. Most may repeat, so one chunk may hold two berry patches; a
few are one to a chunk, marked below.

| Landmark            | Description                                                     |
| ------------------- | --------------------------------------------------------------- |
| **Item Cache**      | A buried stash of items                                         |
| **Berry Patch**     | A bush bearing one kind of berry                                |
| **Phenomenon**      | Something happening: a grotto, dust, ripples, a shadow overhead |
| **Nest**            | An egg of a local species                                       |
| **Legendary Raid**  | A legendary's lair; the raid is named after the place           |
| **Shadow Raid**     | A lair with something wrong in it                               |
| **Wandering NPC**   | Whoever is passing through: a breeder, a nurse, a chef          |
| **Market**          | A vendor's stall, behind one of the trade's four counters       |
| **Auction Board**   | The region's lots, and the only way to them. One to a chunk     |
| **Team Rocket**     | A grunt barring the cell, and once in a while Giovanni          |
| **Trainer**         | A duelling trainer: an Ace, or an expert in one type            |
| **Gym Seat**        | A team another player left standing, to be fought. One to a chunk |
| **Gym Leader**      | One of the region's eight, with a badge on the line. One to a chunk |
| **Elite Four**      | One of the region's four, for a challenger holding every badge  |
| **Champion**        | The region's title, for whoever has beaten the Elite Four. One to a chunk |
| **Portal**          | A way through to another portal, for the price of a Portal Key. One to a chunk |

Walking up to a wandering cell does not reveal in advance which specialist is
standing there. The market, the board and the seat are fixtures: a stall is
always a stall, though which counter it set up changes with the window.

Nothing that somebody stands at is rolled out at sea: the open ocean carries
caches, phenomena, nests, lairs and portals, and nothing else.

The contents of each are covered in [Items and gold](items.md), [Eggs](eggs.md),
[People you meet](npcs.md) and [Battles](battles.md).

## Refresh windows

Different parts of a chunk refresh on different timers. The easier something is
to obtain, the sooner it returns.

| What changes                                    | How often  |
| ----------------------------------------------- | ---------- |
| The pokemon standing in a chunk                 | 5 minutes  |
| Item caches and berry patches                   | 15 minutes |
| What is happening at a phenomenon cell          | 1 hour     |
| Legendary and shadow raids                      | 3 hours    |
| Who is at a wandering-NPC cell, grunts included | 3 hours    |
| Which counter a market stall is keeping         | 3 hours    |
| Which trainer is standing at a trainer cell     | 3 hours    |
| The egg lying in a nest                         | 12 hours   |

Every one of these is a whole number of five-minute windows and all of them are
counted from the same instant, so a landmark never changes halfway through what a
player is doing at it. An item cache that has been emptied stays empty while the
pokemon around it turn over three times.

Windows follow each player's **local** clock. What a player eight hours ahead
found in a chunk says nothing about what another player will find there.

### Time of day

Four periods divide the day, and each has its own pokemon:

| Period  | Hours       |
| ------- | ----------- |
| Morning | 04:00–10:00 |
| Day     | 10:00–17:00 |
| Evening | 17:00–20:00 |
| Night   | 20:00–04:00 |

These are read in the player's own timezone.

### The species day

One pokemon family is featured each day of the year, and it is the same family
for every player in the world: the species day is counted in UTC, so it turns
over at the same instant everywhere rather than sweeping around the world with
local midnight.

There are far fewer families than days in the year, so most days feature nobody
at all. A featured day is an event.

On its day, the featured family receives six bonuses:

| Bonus                | Size | Effect                                         |
| -------------------- | ---- | ---------------------------------------------- |
| Shiny odds           | ×8   | The chance of meeting a shiny one              |
| How often it appears | ×4   | Its share of the pokemon that turn up          |
| Candy from a catch   | ×4   | What catching one pays, whatever it is         |
| Catch chance         | ×2   | How readily a thrown ball sticks               |
| Hidden ability       | ×2   | How often one turns up with its hidden ability |
| Egg steps            | ×1.2 | Every pace walked with one of their eggs       |

Appearing more often does not move a species between rarity bands. A featured
rare pokemon is still rare to encounter; it simply wins its band far more often
than usual. The catch bonus is deliberately small, since balls and berries
already stack up.

The egg bonus is credit for the walking done on the day rather than a discount on
the walk, so an egg carried past midnight keeps what it banked and goes back to
ordinary paces.

A raid cleared on the featured family's own day hands over a pokemon whose
individual stats are all at least 6, so nothing won that day is hopeless.

## Portals

A **Portal** landmark does nothing until a player spends a **Portal Key**, which
is one of the rarer items in the game. The key is consumed by the crossing.

The traveller chooses a **biome** rather than a place, and arrives at the nearest
portal in that biome to the one they left. Almost every biome in the world is
within reach of any given portal, so a key is effectively a way to get anywhere.

If a destination is refused for any reason, the key is not spent.

## Movement

A player clicks where they want to go and their character walks there one cell at
a time, in straight lines only; nothing moves diagonally. A cell takes a quarter
of a second to cross. The route is recalculated at every step, so a pokemon
appearing in the way, or a landmark changing mid-walk, never strands anybody.

Landmarks and pokemon are obstacles rather than destinations. Clicking one walks
the player up **beside** it and interacts on arrival.

A darker one-cell border is drawn around the chunk. Stepping onto it carries the
player into the neighbouring chunk, entering from the opposite side. Four compass
letters stand outside that border and turn with the map as the camera moves.

The player's position is saved every second and a half rather than at every step,
so a page reload never undoes a long walk.

## See also

- [Meeting pokemon](encounters.md)
- [Items and gold](items.md)
- [People you meet](npcs.md)
