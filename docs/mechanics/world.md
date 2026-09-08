# The world

The **world** of Overwander is a single square map, 4,096 chunks across, that is
calculated rather than stored. Its climate, its biomes, the landmarks in every
chunk and everything buried in them are all derived from one world seed at the
moment a player looks at them, so every player sees the same world without any of
it being saved anywhere.

A **chunk** is a 16×16 grid of cells, and it is how the world is bookkept rather
than how it is walked. Each chunk holds a fixed set of landmarks and refreshes
its contents on several independent timers. The ground itself belongs to the
world rather than to the chunk: a border between two countries, a lake or a
ridge of rock runs wherever it runs, and a chunk holds whatever parts of them it
happens to sit on.

What a player sees is a **board**: a stretch of country with them in the middle
of it, following them a cell at a time, so there is no boundary to cross and
nothing to wait for at one. It is three distances rather than one.

| Reach       | Cells | What it decides                                |
| ----------- | ----- | ---------------------------------------------- |
| The country | 20    | How far the ground and its scenery are drawn   |
| The board   | 10    | How far a press reaches, and where the grid is |
| The pokemon | 7     | How near one has to be to be standing there    |

So a player looks out over a good deal more country than they can act on, and a
field fills as they cross it rather than showing its whole hand from the far
side. The board straddles four or nine chunks at once, and everything standing
on it is live whichever chunk it came out of.

## Geography

### Biomes

Three qualities decide the climate of a place: how wet it is, how high it is and
how warm it is. Together they select one of the **25 biomes**, which range
from deep ocean and coral reef through savanna, desert and temperate forest to
volcano, glacier and polar ocean. Climate changes gradually, so a biome typically runs
about two dozen chunks across before giving way to another.

The climate is read a cell at a time, so a country's edge is a wandering line
through the ground rather than a step between one chunk and the next. Standing
on a border, a player can see both sides of it at once. Where one country's name
is wanted for the whole chunk, which is what the map paints and what the pokemon
in it are drawn from, it is the country in the middle of it.

A twenty-sixth place, **Beyond**, exists but is nowhere on the map. Mythical
pokemon are recorded as coming from there, and nothing else does.

### Size and edges

The map is 4,096 chunks on each side, centred on the region where new players
start. At 16 cells to a chunk that is 65,536 cells from edge to edge.

The edge is a wall rather than a wrap-around: walking into it stops the player
rather than bringing them out on the opposite side of the world.

### Towns

The world is divided into regions of 8x8 chunks, and each one holds at most one
**town**: a settled circle 28 cells across, sited wherever the region's own roll
found dry ground. Regions that are all sea have none.

A town is where the services are. Everything somebody stands behind a counter
for lives in one, and the country between towns holds what a player goes out
for: things to forage, things to fight, nests and lairs.

| In a town                                        | Out in the country                     |
| ------------------------------------------------ | -------------------------------------- |
| Market, Auction Board, Gym Seat, Wandering NPC    | Item Cache, Berry Patch, Apricorn Tree  |
| Gym Leader, Elite Four, Champion                  | Nest, Trainer, Team Rocket              |
| Portal                                            | Legendary and Shadow Raid lairs         |

The portal stands dead centre, on the plaza, which is what keeps the network
even and means a player stepping out of the gate is looking down every street at
once. Around it a town holds **nine to fourteen** lots, and no two towns are
alike: about half have an auction board, about half a gym seat, a third a gym
leader, and a champion sits in perhaps one town in twelve. The rest is trade. A
place that had everything would be a place nobody left.

A town levels the ground it stands on: no lakes, no rivers and no rock inside
the footprint, though it stops at the shore rather than draining the sea. No
wild pokemon stand in one and nothing is going on there, so a town is somewhere
to put your guard down. The portal's keeper is the exception, since the keeper
belongs to the portal.

The plaza is paved and a street runs out of it to each lot, stopping at the door
rather than paving it, so nobody is ever standing in the road and following one
always arrives somewhere rather than at the edge of town. No street crosses
another lot on its way: one that would goes round, so a road never stops dead at
somebody's back wall. Streets run north,
south, east and west and turn square corners, never diagonally, so a town is a
couple of avenues out of the plaza with short branches off them to the doors. A
street is paving and nothing more: it does not decide where anybody may walk,
and the ground under it is the same levelled ground the rest of the town is.

Towns are marked on the world map, drawn at the size they really are, so a place
worth walking to is visible from across the country rather than found by
accident. The mark says a settlement is there and nothing more: which town it is
and what it holds are what walking to it is for.

### Inside a chunk

Scenery, landmarks and pokemon may stand on any of a chunk's 256 cells. A clear
cell used to run round the edge of every chunk, so that a player walking in from
the one next door always arrived on empty ground; nobody walks in any more, and
a rim on every chunk drew empty corridors across the world every sixteen cells.

### Water and rock

Lakes, rivers and outcrops of rock are part of the world, not part of a chunk.
Water is walked into and swum: a river crossing a chunk is a route, not a wall.
Rock is not. Nothing stands in it, nothing walks through it, and a hollow small
enough to be walled in is filled rather than left as somewhere unreachable.

Nothing is ever placed against rock, so every landmark has open ground on all
sides of it. Scenery keeps to dry land, and where a lake has taken most of a
chunk there is simply less of it.

Scenery and landmarks keep a clear cell on every side of them, diagonals
included, so there is always somewhere to stand beside whatever a player has
walked over to. Two of them either side of a chunk boundary may occasionally
touch, since each is placed knowing only its own chunk. Pokemon keep no such
berth. They take any cell a fixture is not standing on, and a walk goes straight
through one rather than round it. Scenery and landmarks are walked round: both
are standing there, so a route goes past them.

The three kinds are laid down in order: **scenery, then landmarks, then
pokemon**. The first two are fixed forever and the last is rolled again every
few minutes. A window's pokemon fit themselves around the chunk rather
than the chunk being rearranged around them.

## Scenery

Every chunk carries **eight to twelve** pieces of scenery: trees, rocks, cactus,
reeds, ice, whatever its biome is made of. None of it can be pressed and none
of it does anything; it is there so a taiga looks like a taiga. Like landmarks,
scenery belongs to the chunk permanently.

## Landmarks

A chunk of open country holds **two to four landmarks**, and a chunk a town
falls on holds that town's lots as well. They never move. The
same chunk has the same landmarks on the same cells permanently; only their
contents change. Most may repeat, so one chunk may hold two berry patches; a
few are one to a chunk, marked below.

| Landmark           | Description                                                                                                                                                                         |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Item Cache**     | A buried stash of items                                                                                                                                                             |
| **Berry Patch**    | A bush bearing one kind of berry                                                                                                                                                    |
| **Apricorn Tree**  | A tree bearing one colour of apricorn, for Kurt to carve                                                                                                                            |
| **Nest**           | An egg of a local species                                                                                                                                                           |
| **Legendary Raid** | A legendary's lair; the raid is named after the place                                                                                                                               |
| **Shadow Raid**    | A lair with something wrong in it                                                                                                                                                   |
| **Wandering NPC**  | Whoever is passing through: a breeder, a nurse, a chef                                                                                                                              |
| **Market**         | A vendor's stall, behind one of the trade's four counters                                                                                                                           |
| **Auction Board**  | The region's lots, and the only way to them. One to a chunk                                                                                                                         |
| **Team Rocket**    | A grunt barring the cell, one window in eight an executive, and once in a while Giovanni                                                                                            |
| **Trainer**        | A duelling trainer: an Ace, or an expert in one type                                                                                                                                |
| **Gym Seat**       | A team another player left standing, to be fought. One to a chunk                                                                                                                   |
| **Gym Leader**     | One of the sixteen, with a badge on the line. One to a chunk                                                                                                                        |
| **Elite Four**     | One of the eight, for a challenger holding their league's badges                                                                                                                    |
| **Champion**       | Blue or Lance, for whoever has beaten their league's Elite Four. They field the team they are known for, and one window in sixty-four a legend has the seat instead. One to a chunk |
| **Portal**         | A way through to another portal, for the price of a Portal Key. One to a chunk                                                                                                      |

Walking up to a wandering cell does not reveal in advance which specialist is
standing there. The market, the board and the seat are fixtures: a stall is
always a stall, though which counter it set up changes with the window.

**The ring under somebody's feet says what walking up to them does**, which the
coat they are drawn in does not. Blue for a counter and red for a roadside duel,
crimson for a cell Team Rocket is barring, and then a colour apiece for the three
rungs of the league: amber for a gym, violet for a seat of the Elite Four, gold
for a champion. A player short of one badge can pick the cell out without walking
the chunk.

**Phenomena are not landmarks.** A grotto, a dust cloud, rippling water or a
shadow overhead is something _happening_ rather than somewhere to go, so it is
not fixed to a cell. Up to two are rolled across a chunk's open ground each
hour and are somewhere else the next one, so a chunk you know is still worth
looking over. They take dry ground where a chunk has any, which is why a marsh
still hides grottos and the open sea, having no ground at all, only ever
ripples. Once you have walked into one it stops being drawn for you; somebody
else walking the same chunk that hour still finds it.

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
| Item caches, berry patches and apricorn trees   | 15 minutes |
| Where things are happening, and what they are   | 1 hour     |
| The weather over a chunk                        | 1 hour     |
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

| Period  | Hours          |
| ------- | -------------- |
| Morning | 04:00 to 10:00 |
| Day     | 10:00 to 17:00 |
| Evening | 17:00 to 20:00 |
| Night   | 20:00 to 04:00 |

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
individual stats are all at least 10, so nothing won that day is hopeless.

## Weather

The sky over a chunk changes every hour, and it is not rolled per chunk: it is
read off a **weather field** laid over the whole world, so a front covers a
stretch of country and neighbouring chunks share it. Walking out of the rain is a
walk rather than a step. The field itself never changes; what moves is where it
is read, so weather travels in a direction the way real weather does.

What the sky can do depends on the ground under it. The same front is a
thunderstorm over rainforest, a blizzard over a glacier and a sandstorm over the
desert it crosses next: one weather system meeting different countries. A front
arrives in order, too, so a clear afternoon turns hazy, then damp, then wet
before it turns to a storm.

A few skies are showpieces and turn up rarely and in one place at a time: an
**aurora** over the far north, a **rainbow** over open water, and **pollen
drift** through a forest.

Above those sits a tier of its own, and there are four of them. Each is reached
from further out than any showpiece and each falls over **every country in the
world**, so what holds them back is the band rather than the map: roughly one
window in twelve hundred apiece. Each favours **all eighteen types at once**,
which nothing else does, so anything met under one carries the floor of 10
whoever you are raising. Each then does one thing no other weather does, and no
two touch the same part of what a pokemon is.

| Sky               | What it is                                                                       | What it is worth                                  |
| ----------------- | -------------------------------------------------------------------------------- | ------------------------------------------------- |
| **Meteor shower** | The old rarest sky, moved to a band of its own                                   | Double the odds of a **shiny coat**               |
| **Fata morgana**  | The mirage that rises off dead-still air, stacking a coastline into cliffs       | Double the odds of a **hidden ability**           |
| **Dark day**      | Noon gone dark under carried smoke, in air bone dry and moving hard              | About a third of what is met is a **shadow**      |
| **Fogbow**        | A rainbow with the colour gone, formed in fog fine enough to scatter light white | What is met knows one of its line's **egg moves** |

The two doublings stack with the day's featured family and with anything the
player is carrying.

A **dark day** is a window of decisions rather than a haul. It is the only place
in the world outside Team Rocket that a shadow comes from, and a shadow is worth
having: purified, it keeps the mark and gains two points on every value. It is
also the one sky you cannot see across. The board goes near black, lit only in a
pool around the player and around every landmark, and a wild pokemon carries no
light of its own, so finding one means walking a lamp onto it. A buddy with
**Illuminate** more than doubles how far that pool reaches.

A **fogbow** hands over what breeding was the only way to come by, when there is
anything to hand over: about half the families have an egg move at all, so half
of what you meet under one is given nothing.

**What weather is worth.** Every sky is kind to a type or two, and a pokemon of a
type its sky favours comes with a floor of **10 under every one of its six
values**. Everything else met in that weather rolls exactly as it would have
under a clear sky: rain is worth walking into for a Water type, not for whatever
happens to be standing in it.

Rain favours Water and Electric, a breeze favours Flying, cloud favours Normal,
mist favours Bug, Grass and Poison, fog favours Ghost, Dark and Psychic, and so on
down every one of the eighteen types: whatever a player is raising, there is
weather worth going out in for it.

The pairings follow how often a sky actually turns up rather than only what it
looks like. This world is wet and cold, so damp skies are common and storms are
rare, and a type paired with nothing but a sandstorm would be a type nobody is
ever boosted for. The commonest boosted type comes up about five times as often
as the rarest, not fifty.

Floors **stack**. A raid on the family's own day already carries a floor of 10, so
one fought under a sky that favours its type carries **20**, which makes the
right weather on the family's own day the best day to raid.

**What a sky is holding.** Weather decides who turns up as well as how good they
are. A favoured type is crowded into the chunk's spawns at **twice** its ordinary
weight, the way a species day crowds its family at four times, so walking into a
storm is a reason to look for what a storm is about. The bands do not move, so a
favoured rare stays rare and only wins its band more often, and a sky can only
crowd what already lives there: rain over a grassland roughly doubles a small
share of it, and rain over a coral reef changes nothing because everything there
was already Water. The four rarest skies are left out, since they are kind to
every type and lifting every entry at once is the pool they started with.

One sky favours nothing at all. A clear afternoon is the ordinary weather and
about two windows in five are one, which is what makes the rest worth walking
into.

**Weather in a fight.** A trainer met out in the world is fought under the sky
that was over them, so rain falls on the field and does to the fight what rain
does: water moves hit harder, fire moves hit softer, and a sandstorm or hail
chips at whoever is not built for it. Only that kind of fight reads the sky. A
raid, a duel, a gym seat and any fight between players are all fought under a
clear sky whatever the world is doing, so nobody wins a match on the weather they
happened to stand in.

Not every sky reaches a battle. Rain, snow, hail, sand, fog and heat all have a
counterpart the fight understands; the showpieces and the calm skies do not, and
those are worth what is met under them and nothing more. A fight keeps the sky it
started under, so watching it back later shows the weather it was actually fought
in.

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

The player stays in the middle of the board and the world scrolls under them, so
walking is continuous: there is no boundary to step over and no wait when one is
crossed. Anywhere inside the ruled circle can be pressed, which is ten cells in
any direction; the country drawn past it is looked out over rather than walked
to a square at a time. Four compass marks stand at the edge of the ruled circle
and turn with the map as the camera moves. Each one points the way it stands
for, and north is the red one.

The board can be turned: drag it with the right button, or twist two fingers on a
touch screen. A drag or a twist that moved the camera does not count as a press on
whatever it finished over. A card that opens on hover is opened by a **hold**
instead where there is no pointer to hover with.

The player's position is saved every second and a half rather than at every step,
so a page reload never undoes a long walk.

**One walk, however many screens are signed in.** A second screen that finds the
walk has gone somewhere it is not stands down: it stops walking, hands over the
paces it had not reported yet, and says where the walk went. One press takes it
back, which stands the other screen down in turn.

## See also

- [Meeting pokemon](encounters.md)
- [Items and gold](items.md)
- [People you meet](npcs.md)
