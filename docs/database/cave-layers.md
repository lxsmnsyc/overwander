# Cave layers

How the cave world is derived from the surface one, where its mouths are, and
how a call says which layer it is about.

## The caves

A cave is the same `World` at another `Depth`, not a subsystem. The pair shares
every noise field and every coordinate, and a cave world changes exactly two
things:

- **chunk seeds** become `` `${seed}cave(x, y)` ``, so landmarks, spawns and
  window rows all re-derive underground for free. `chunk_seed` is `text`, so
  `snapshots` and `snapshot_spawns` needed **no migration**.
- **`roleAt`** reads the depth: underground a cell is `ground` where
  `isCaveFloor` says so and `wall` everywhere else. There is no water below.

`isCaveFloor` ([`src/overworld/fields.ts`](../../src/overworld/fields.ts)) is
three things: **chambers** where the surface has rock, **veins** joining them,
and **elbows** making the veins walkable.

A vein is a ridge read off `world.stone` at a coarser step and a different
corner of itself, the way `isRiver` reads the lake field. Its width is what
stops a cave being a second overworld, and it is tuned against what a player can
actually walk, counting **orthogonal steps only**, over the most mountainous
country the world grows in a 300-cell square:

| vein width    | open      | biggest walkable | reach                  |
| ------------- | --------- | ---------------- | ---------------------- |
| chambers only | 16.5%     | 195              | 34                     |
| **0.008**     | **21.3%** | **1,562**        | **115**                |
| 0.02          | 23.8%     | 2,771            | 220                    |
| 0.03          | 25.8%     | 16,518           | 299 (the whole square) |

An **elbow** is the fix for a passage that steps diagonally. A vein corners
wherever the field does, and nothing in this game moves diagonally, so two cells
touching only at their corners are two dead ends. Where a diagonal pair has both
of its connecting cells solid, the **westerly** one opens: the two candidates
see the same pair with both offsets negated, so exactly one of them acts without
either having to ask. It is not exhaustive, since an elbow can meet another
elbow, but those are under 1% of floor cells and a second pass would widen the
passages more than it is worth.

Measuring this before the elbows existed gave a reach of 79 cells, which was an
artifact. The field was that connected all along and simply could not be walked.

Nothing is decorated underground. `getDecorationCells` takes an empty kind list
at depth, since a cave carries the biome overhead so its spawns and lairs know
where they are, not so it can sprout that biome's trees.

Every cell where the surface crosses between sea and land is solid, so the sea
caves are a separate network.

## Mouths

A mouth is a **pair of cells**, derived rather than rolled
([`src/overworld/cave.ts`](../../src/overworld/cave.ts)): surface ground with
rock beside it, and that rock, which is floor below. Both layers stage
`Landmark.CaveMouth` on their own half, placed in `getLandmarkCells` outside the
roll the way `portalCellIn` places the portal. The region's portal keeps its
ring and is refused a mouth **in the scan itself**, so a mouth the surface had
no room for is not staged underground either. A way in is always a way back out.

The scan is cheap-first, because every chunk in the world runs it: one `isRock`
sample per cell, cached per chunk, and the full `roleAt` reading only for the
pairs that get past it.

## Which layer a call is about

`depth` rides beside `offset` through every call that resolves a chunk, for the
same reason `offset` does: the server has to derive the chunk the client was
looking at. It is optional and defaults to `Depth.Surface`, so the paths that
can only ever happen above ground (the NPCs, the gyms, the portals) are
untouched. `ChunkSnapshot.depth` is what the client hands over, so no
client-facing signature changed. A player who lies about their layer stands
somewhere they are not and finds exactly what is there, which is the rule
positions already follow.

`positions.depth` is the one stored fact. The same cell is open ground above and
solid rock below, so a reload that guessed would put somebody inside a mountain.

## See also

- [Shared overworld tables](overworld.md)
- [Overworld claims](world-claims.md)
- [Towns and wandering NPCs](town-npcs.md)
