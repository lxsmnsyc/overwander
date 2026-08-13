# The world

One string is the whole map. `VITE_WORLD_SEED` seeds three Perlin noise
channels, the channels decide a climate for every chunk, the climate classifies
into a biome, and the chunk's own seed decides everything standing in it. No part
of the world is generated ahead of time or written down, so it costs nothing to
have and every player computes the same one.

## From a seed to a biome

[`World`](../../src/overworld/world.ts) expands the seed into three noise fields
— humidity, elevation and temperature, drawn **in that order**, which is part of
the world format: reordering the draws reshapes every world ever generated from
the same string.

A chunk's climate is sampled at its **centre** rather than its corner. Integer
coordinates land exactly on the noise lattice, where Perlin noise is always zero,
and a world sampled there would be one biome from edge to edge. The sample is
taken at `CLIMATE_FREQUENCY` (1/24), so a climate region is roughly two dozen
chunks across, and each of the three values is spread by `CLIMATE_SPREAD` (1.5)
and clamped: Perlin values cluster near zero, which would starve the biomes whose
targets sit at the ends of the scale.

The three numbers are then matched against the target climate of every biome in
`BIOME_CONFIGS` ([`src/data/ids/biome.ts`](../../src/data/ids/biome.ts)), and the
nearest one wins. There are 24 of them, from `DeepOcean` to `AlpineTundra`.

A twenty-fifth, **`Beyond`**, is deliberately absent from that table — the type
says so, so no sampling can land on it and no spawn pool is registered for it. It
is where a mythical comes from, and it is nowhere on the map.

## Coordinates

The world is square and finite: `WORLD_SIZE` (4096) chunks a side, centred on the
origin, so both axes run from −2048 to 2047. At 16 cells to a chunk that is
65,536 cells across — more ground than a population can wear out, and bounded, so
every coordinate the game stores has a known range.

The edge is a **wall, not a seam**. Coordinates outside the world clamp to the
nearest chunk inside it rather than wrapping, because chunk −2048 and chunk 2047
have unrelated climates and the join would show. Clamping also means a
hand-written server call cannot generate ground that does not exist.

## Inside a chunk

A chunk is a 16×16 grid of cells. Two rings of it are kept clear on purpose:

| Area              | Size  | What may stand there      |
| ----------------- | ----- | ------------------------- |
| The whole chunk   | 16×16 | Walking                   |
| The spawn area    | 12×12 | Pokemon, on any free cell |
| The landmark area | 8×8   | Landmarks, one per cell   |

Landmarks keep to the middle so that a player crossing in from a chunk edge never
lands on something interactive immediately, and spawns keep to a slightly wider
middle for the same reason.

Each chunk rolls **3 to 5 landmarks** from its seed alone — no clock involved —
so the same chunk has the same landmarks on the same cells forever. Duplicates
are allowed. Every landmark also keeps the ring of cells around it, diagonals
included, clear of everything: no two landmarks touch and no pokemon stands in
the way of one, so there is always somewhere to stand beside it. Placing one
takes up to nine of the central sixty-four cells, so five always fit; a chunk
that somehow ran out takes fewer landmarks rather than crowding them.

### What a landmark can be

| Landmark             | What it is                                                     |
| -------------------- | -------------------------------------------------------------- |
| **Item Cache**       | A buried stash, rolled from the item pool                      |
| **Berry Patch**      | A bush bearing one kind of berry                               |
| **Phenomenon**       | Something going on: a grotto, dust, ripples, a shadow overhead |
| **Nest**             | An egg of a local species, one per half day                    |
| **Legendary Lair**   | A place a legendary lives; the raid is named after the place   |
| **Shadow Lair**      | A lair with something wrong in it                              |
| **Team Rocket Stop** | A grunt who bars the cell and fights each passer-by alone      |
| **Wandering NPC**    | Whoever happens to be passing through this window              |
| **Portal**           | A way through to another portal, for the price of a Portal Key |

What each one gives is in [Items and gold](items.md), [Eggs](eggs.md) and
[Battles](battles.md).

## Windows

Nothing in a chunk turns over on one clock. A window is as long as what it holds
is worth: the pokemon a player walks past are the fastest thing in the world, the
ground they dig up is slower, and anything worth making a trip for outlives the
trip.

| Window                | Length     | What turns over                         |
| --------------------- | ---------- | --------------------------------------- |
| `SNAPSHOT_INTERVAL`   | 5 minutes  | The spawns standing in the chunk        |
| `LANDMARK_INTERVAL`   | 15 minutes | Item stashes and berry patches          |
| `PHENOMENON_INTERVAL` | 1 hour     | What is going on at a phenomenon cell   |
| `RAID_INTERVAL`       | 3 hours    | Legendary and shadow raid lobbies       |
| `ROCKET_INTERVAL`     | 3 hours    | Team Rocket stops                       |
| `NPC_INTERVAL`        | 6 hours    | Who is standing at a wandering-NPC cell |
| `NEST_INTERVAL`       | 12 hours   | The egg lying in a nest                 |

Every interval is a whole number of snapshot windows, and all of them are floored
from the same instant, so a landmark never turns over halfway through the window
a player is standing in. A cache picked clean stays picked clean while the
pokemon around it turn over three times.

The windows are **local**. The instant comes from the server clock, but it is
read in the player's own zone and the zone is part of every seed and stored key,
so what a player in UTC+8 finds in a chunk says nothing about what a player in
UTC−5 will find there. See [Time](../firestore/time.md).

### Time of day

Four periods, from the mainline games — the Gen 2 clock plus the later evening
split — and a spawn pool has its own entries for each:

| Period  | Hours       |
| ------- | ----------- |
| Morning | 04:00–10:00 |
| Day     | 10:00–17:00 |
| Evening | 17:00–20:00 |
| Night   | 20:00–04:00 |

Because the window is local, this is the player's own morning.

### The species day

One family is featured per day of the year, counted in UTC so that everybody's
species day turns over at the same moment. Family numbers run far short of a
year, so most days feature nobody — a blank day is the normal case, and the rule
stays a plain equality however many generations are registered later.

On its day, a family gets four boosts of different sizes:

| Boost                      | Factor | Where it applies                         |
| -------------------------- | ------ | ---------------------------------------- |
| `SPECIES_DAY_SHINY_BOOST`  | ×8     | The shiny odds of its members            |
| `SPECIES_DAY_WEIGHT_BOOST` | ×4     | Its weight inside whatever band it is in |
| `SPECIES_DAY_CANDY_BOOST`  | ×4     | The candy a catch of it pays             |
| `SPECIES_DAY_CATCH_BOOST`  | ×2     | The chance a thrown ball lands           |

The weight boost does not move a species between bands: a featured rare stays
rare, it simply wins its band more often. The catch boost is the lightest of the
four on purpose, since the catch chance is already stacked with the ball and
whatever the encounter has been fed.

A raid cleared on the featured family's own day also floors every individual
value of its prize at `RAID_FAMILY_DAY_MIN_IV` (6), so nothing that comes out of
one is hopeless.

## Portals

A Portal landmark does nothing on its own. Opening one takes a **Portal Key** —
the rarest band's find — and the key is spent in the crossing.

The traveller names a **biome**, never a destination. Where they come out is the
nearest portal of that biome to the one they are standing in, derived in
[`src/overworld/portal.ts`](../../src/overworld/portal.ts) from the chunk seeds
alone. That is what makes the network a network rather than a teleport: the
listing is computed on the client without asking anything of the server, and the
server re-derives the same answer when the crossing is requested, so there is
nothing in the request to lie about except which way to go.

`findPortals` walks outward ring by ring and answers for **every biome at once**:
the first portal of a biome it meets is that biome's nearest, and a biome already
answered for is never looked at again. It stops at `PORTAL_RANGE` (96 chunks) or
once every biome has been found. From a typical portal, essentially all of them
are reachable.

The key is taken **last**, so a traveller refused a destination keeps it.

## Standing somewhere

A player's position is the one mutable record of anybody's place in the world,
and it is the client's own word, written every 1.5 seconds rather than every
step. It exists so a page reload does not undo a forty-chunk walk. Nothing in the
game trusts it: reaching a landmark is checked against the landmark and its
window, a spawn against the published spawn store, a portal against the chunk
seed. A player who lies about where they are stands somewhere they are not and
finds exactly what is there.

Nothing triggers by being walked over, either. A player steps within the 3×3
around a pokemon or a landmark and **clicks** it; passing through a cell springs
nothing. Reach decides what a player bothers to walk to, not what they are
allowed to claim.

## Getting there

A press says where to be, not which way to face. The route is A\* over the
chunk's own grid ([`src/overworld/path.ts`](../../src/overworld/path.ts)),
straight steps only — nothing in this game moves diagonally — and it is walked a
cell every quarter second, so a walk costs the same paces an egg is counted by. The
route is re-planned at every step rather than kept as a list, because the chunk
moves under a walk: a window turns over, another player takes a spawn, something
appears in the way.

Landmarks and whatever is standing in the chunk are obstacles rather than
destinations, so a press on one walks up **beside** it and reaches out on
arrival — the same 3×3 an interaction is checked against.

The board is drawn with a one-cell apron around the chunk, shaded darker than
the ground inside it. Those cells are thresholds: walking onto one is the step
that carries a player into the neighbouring chunk, re-entering it from the
opposite edge. The four corners of the apron are not drawn, since a straight
step could never reach one. Which way is which is read off the four compass
letters standing outside the apron; they are points on the ground like anything
else, so they turn with the board as the camera walks around it.

See [`positions/{uid}`](../firestore/player-stores.md#positionsuid) and
[Reaching, not treading](../firestore/overworld.md#reaching-not-treading).
