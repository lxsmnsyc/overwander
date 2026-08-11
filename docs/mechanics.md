# Game mechanics

What the game actually does: how the ground under a player is decided, what
turns up on it, what a thrown ball is worth, how a fight resolves, and what
raising a pokemon costs. These pages describe the rules; the
[Firestore pages](firestore.md) describe where the results are written and who
is allowed to write them.

## The pages

| Page                                  | What it covers                                                              |
| ------------------------------------- | --------------------------------------------------------------------------- |
| [The world](mechanics/world.md)       | Seeds, biomes, chunks, landmarks, the windows they turn over on, portals    |
| [Encounters](mechanics/encounters.md) | Spawn rolls, how one pokemon is derived, shininess, what a buddy changes    |
| [Catching](mechanics/catching.md)     | The safari session: balls, feeding, fleeing, and the odds behind each throw |
| [Battles](mechanics/battles.md)       | The real-time engine, damage, statuses, and the four kinds of fight         |
| [Raising](mechanics/raising.md)       | Candy, evolution, effort, friendship, bottle caps, purification, healing    |
| [Eggs](mechanics/eggs.md)             | Nests, breeding, inheritance, and walking one open                          |
| [Items and gold](mechanics/items.md)  | What the ground holds, what things are worth, and where gold comes and goes |

## Four ideas behind all of it

**The world is derived, not stored.** A chunk's biome, its landmarks, what is
buried in them and who is standing on them all come back out of a seed and a
window. Nothing is generated in advance and nothing is kept, so the world is as
large as its coordinate space rather than as large as its database. The only
things stored are the ones players *did*: a catch, a claim, a bid.

**Instants belong to the server, calendars belong to the player.** The clock a
window is measured against is central, so a device cannot move time. The *zone*
it is read in is the player's own, and it scopes what they find: a chunk is not
one world seen from several clocks but one per zone, so a player walking at night
meets what the night pool holds. See [Time](firestore/time.md).

**Effects are written once and register themselves.** A field ability, a held
item, a status, a move — each is one file that listens for the questions it has
an opinion about. Nothing that stages a spawn, resolves a hit or prices a reward
names an ability. Adding one is adding a listener; it is why the overworld and
the battle look like the same machine at two scales, and they are: both are the
event engine in [`src/core/event-engine.ts`](../src/core/event-engine.ts).

**A fight is a seed, not a recording.** Battles run from the battle document's
own id, so every participant and every spectator replays identical rolls from
identical frozen teams. Nothing about a battle is streamed between players, and a
replay is the same computation run again.
