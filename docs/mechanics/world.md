# The world

The **world** of Overwander is a single square map, 4,096 chunks across, that is
calculated rather than stored. Its climate, its biomes, the landmarks in every
chunk and everything buried in them are derived from one world seed at the
moment a player looks at them, so every player sees the same world without any
of it being saved anywhere.

A **chunk** is a 16×16 grid of cells. It is how the world is bookkept rather
than how it is walked. Each chunk holds a fixed set of landmarks and refreshes
its contents on several timers, which [The clock](world-time.md) covers. The
ground itself belongs to the world rather than to the chunk. A border between
two countries, a lake or a ridge of rock runs wherever it runs, and a chunk
holds whatever parts of them it sits on.

What a player sees is a **board**: a stretch of country with them in the middle
of it, following them a cell at a time. There is no boundary to cross and no
wait at one. The board is three distances rather than one.

| Reach       | Cells | What it decides                                |
| ----------- | ----- | ---------------------------------------------- |
| The country | 20    | How far the ground and its scenery are drawn   |
| The board   | 10    | How far a press reaches, and where the grid is |
| The pokemon | 7     | How near one has to be to be standing there    |

A player sees more country than they can act on. A field fills in as they cross
it rather than showing everything from the far side. The board straddles four
or nine chunks at once, and everything standing on it is live whichever chunk it
came out of.

## Biomes

Three qualities decide the climate of a place: how wet it is, how high it is and
how warm it is. Together they select one of the **25 biomes**, which range from
deep ocean and coral reef through savanna, desert and temperate forest to
volcano, glacier and polar ocean. Climate changes gradually, so a biome
typically runs about two dozen chunks across before giving way to another.

The climate is read a cell at a time, so a country's edge is a wandering line
through the ground rather than a step between one chunk and the next. Standing
on a border, a player can see both sides of it at once. Where one country's name
is wanted for the whole chunk, which is what the map paints and what the pokemon
in it are drawn from, it is the country in the middle of it.

A twenty-sixth place, **Beyond**, exists but is nowhere on the map. Mythical
pokemon are recorded as coming from there, and nothing else does.

## Size and edges

The map is 4,096 chunks on each side, centred on the region where new players
start. At 16 cells to a chunk that is 65,536 cells from edge to edge.

The edge is a wall rather than a wrap-around. Walking into it stops the player
rather than bringing them out on the opposite side of the world.

## Towns

The world is divided into regions of 8x8 chunks, and each one holds at most one
**town**: a settled circle 28 cells across, sited wherever the region's own roll
found dry ground. Regions that are all sea have none.

Every service with somebody behind a counter is in a town. The country between
towns holds what a player goes out for: things to forage, things to fight, nests
and lairs.

| In a town                                        | Out in the country                     |
| ------------------------------------------------ | -------------------------------------- |
| Market, Auction Board, Gym Seat, Wandering NPC    | Item Cache, Berry Patch, Apricorn Tree  |
| Gym Leader, Elite Four, Champion                  | Nest, Trainer, Team Rocket              |
| Pokémon Center, Portal                            | Legendary and Shadow Raid lairs         |

The portal stands dead centre, on the plaza. That keeps the portal network
evenly spread, and a player arriving by portal can see down every street at
once. Around it a town holds **nine to fourteen** lots. Every town holds the whole
ladder: a **Pokémon Center** so a party can be healed, a **gym seat** and an
**auction board**, and a **gym leader**, an **Elite Four member** and a
**champion**, so a badge run is a walk from one town to the next rather than a
search for the town that has a fight in it. What differs is the second gym:
about a third of towns stand a second leader, which is two badges in one walk.
The remaining lots are trade.

## The name

Every town has a **name of its own**, and no two towns anywhere share one. The
name is built out of the country the town stands on, so it describes the ground
before the map is looked at, and it ends with the **county** it stands in, which
says roughly where in the world that is.

| Name | Where |
| ---- | ----- |
| Rimefell Village, Ashmarch | A glacier, out west |
| Ochrereach Town, Sedgemoor | A desert |
| Port Saltmere City, Dunhollow | A rocky coast |

The world is divided into 64 counties, so places on opposite sides of it are
never confused for one another, and a name is worked out from where a town is
rather than picked, so no two ever collide.

Walking into a town is what puts it on the map. The register is shared: a town
**any** player has found is a town **every** player can travel to, so passing a
name to a friend is worth something. A town nobody has walked into cannot be
crossed to, even if its name is guessed correctly.

A town levels the ground it stands on: no lakes, no rivers and no rock inside
the footprint, though it stops at the shore rather than draining the sea. Its
streets have wild pokemon of their own, the kind that live around people: Pidgey
and Rattata by day, Meowth and Grimer after dark, and Porygon at any hour. Every
town shares that one list, whatever country it stands in. Nothing else happens
in a town.

The plaza is paved and a street runs out of it to each lot, stopping at the door
rather than paving it, so nobody stands in the road and following a street
always arrives at a door. No street crosses another lot on its way: one that
would goes round, so a street never ends at somebody's back wall. Streets run
north, south, east and west and turn square corners, never diagonally, so a town
is a couple of avenues out of the plaza with short branches off them to the
doors. A street is paving and nothing more. It does not decide where anybody may
walk, and the ground under it is the same levelled ground the rest of the town
is.

The world map shows each chunk's country and rings every chunk a town stands in,
so a town can be picked out from across the map rather than found by accident.
The **Detailed world map** setting draws the ground itself instead: water, how
high the land stands and where its cliffs are, towns and the routes between
them. It takes a moment to fill in. Either way the map only shows that a
settlement is there. Which town it is and what it holds are learned by walking
to it.

## Inside a chunk

Scenery, landmarks and pokemon may stand on any of a chunk's 256 cells, its
edges included.

The three kinds are laid down in order: **scenery, then landmarks, then
pokemon**. The first two are fixed forever and the last is rolled again every
few minutes. A window's pokemon fit themselves around the chunk rather than the
chunk being rearranged around them.

Scenery and landmarks keep a clear cell on every side of them, diagonals
included, so there is always somewhere to stand beside whatever a player has
walked over to. Two of them either side of a chunk boundary may occasionally
touch, since each is placed knowing only its own chunk. Pokemon keep no such
berth. They take any cell a fixture is not standing on, and a walk goes straight
through one rather than round it. Scenery and landmarks are walked round: both
are standing there, so a route goes past them.

## Water and rock

Lakes, rivers and outcrops of rock are part of the world, not part of a chunk.
Water is walked into and swum, so a river crossing a chunk is a route rather
than a wall. Rock is not. Nothing stands in it, nothing walks through it, and a
hollow small enough to be walled in is filled rather than left as somewhere
unreachable.

Nothing is ever placed against rock, so every landmark has open ground on all
sides of it. Scenery keeps to dry land, and where a lake has taken most of a
chunk there is simply less of it.

A lake or a river running through dry country holds only what can be in water.
The country's pokemon were chosen for the land around the water, so a Rhyhorn
keeps to the bank and a Poliwag does not. A country that is water itself, an
ocean or a swamp, is not held to this: everything that turns up there was chosen
knowing where it would be standing.

## Scenery

Every chunk carries **eight to twelve** pieces of scenery: trees, rocks, cactus,
reeds, ice, whatever its biome is made of. None of it can be pressed and none of
it does anything. It is there for the look of the country. Like landmarks,
scenery belongs to the chunk permanently.

## Landmarks

A chunk of open country holds **two to four landmarks**, and a chunk a town
falls on holds that town's lots as well. They never move. The same chunk has the
same landmarks on the same cells permanently; only their contents change. Most
may repeat, so one chunk may hold two berry patches. A few are one to a chunk,
marked below.

| Landmark            | Description                                                     |
| ------------------- | --------------------------------------------------------------- |
| **Item Cache**      | A buried stash of items                                         |
| **Berry Patch**     | A bush bearing one kind of berry. Not on ground nothing roots in |
| **Apricorn Tree**   | A tree bearing one colour of apricorn, for Kurt to carve. Not above the tree line |
| **Nest**            | An egg of a local species                                       |
| **Legendary Raid**  | A legendary's lair; the raid is named after the place           |
| **Shadow Raid**     | A lair holding a shadow pokemon                                 |
| **Wandering NPC**   | Whoever is passing through: a breeder, a nurse, a chef          |
| **Market**          | A vendor's stall, behind one of the trade's four counters       |
| **Auction Board**   | The region's lots, and the only way to them. One to a chunk     |
| **Team Rocket**     | A grunt barring the cell, one window in eight an executive, and once in a while Giovanni |
| **Trainer**         | A duelling trainer: an Ace, or an expert in one type            |
| **Gym Seat**        | A team another player left standing, to be fought. One to a chunk |
| **Gym Leader**      | One of the twenty-five, with a badge on the line. One to a chunk |
| **Elite Four**      | One of the twelve, for a challenger holding their league's badges |
| **Champion**        | Blue, Lance, Wallace or Cynthia, for whoever has beaten their league's Elite Four. They field the team they are known for, and one window in sixty-four a legend has the seat instead. One to a chunk |
| **Frontier Brain**  | The house champion of a Battle Frontier facility, for whoever holds that region's crown. Three a side, under the house's own rule |
| **Portal**          | A way through to another town's portal, for the price of a Portal Key. One to a town, and none in the country |
| **Pokémon Center**  | Nurse Joy behind her counter. One to a town, and none in the country |

Walking up to a wandering cell does not reveal in advance which specialist is
standing there. The market, the board and the seat are fixtures: a stall is
always a stall, though which counter it set up changes with the window.

**The ring under somebody's feet says what walking up to them does.** The coat
they are drawn in does not. Blue is a counter, red a roadside duel, crimson a
cell Team Rocket is barring, and then a colour apiece for the three rungs of the
league: amber for a gym, violet for a seat of the Elite Four, gold for a
champion. A player looking for one of them can pick the cell out without walking
the chunk.

**Phenomena are not landmarks.** A grotto, a dust cloud, rippling water or a
shadow overhead is something happening rather than somewhere to go, so it is not
fixed to a cell. Up to two are rolled across a chunk's open ground each hour and
are somewhere else the next one, so a chunk already walked can still hold
something new. They take dry ground where a chunk has any, so a marsh still
hides grottos, and the open sea, which has no dry ground, only ever has
ripples. Once a player has walked into one it stops being drawn for them.
Somebody else walking the same chunk that hour still finds it.

Nothing that somebody stands at is rolled out at sea. The open ocean carries
caches, phenomena, nests, lairs and portals, and nothing else.

The contents of each are covered in [Items](items.md), [Where items come
from](item-sources.md), [Eggs](eggs.md), [People you meet](npcs.md) and
[Battles](battles.md).

## See also

- [The clock](world-time.md): refresh windows, the time of day, the species day
- [Weather](weather.md)
- [The caves](world-caves.md)
- [Getting around](world-travel.md): walking and portals
- [Meeting pokemon](encounters.md)
- [Items](items.md)
- [People you meet](npcs.md)
