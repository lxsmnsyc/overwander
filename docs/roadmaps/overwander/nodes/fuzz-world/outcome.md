# Outcome: fuzz-world

## Status

- Done. Every acceptance item is met. One property found a bug too wide for this node and runs as `it.fails` until `meetings-cell-biome` fixes it.

## Built

- `test/fuzz/world/arbitraries.ts`: world seed (the live one or any string), cell (either depth, chunks near the origin and out to the edge), clock (2020 to 2040, a zone a quarter hour at a time), buddy (field abilities weighted in) and player.
- `test/fuzz/world/sky.test.ts` (in `pnpm test`): the weather map opens on the snapshot's hour, and shows the sky the snapshot and the board stand under, for any chunk, depth, instant and zone.
- `test/fuzz/world/walking.test.ts` (in `pnpm test`): a route across the board takes its Euclidean length times the pace, the same turned a quarter. A stranger's run plays for its Euclidean length times the pace, turned or not.
- `test/fuzz/world/meetings.fuzz.ts` (in `pnpm fuzz`):
  - Spawns stand on the cell they were placed on, out of that cell's own pool.
  - Spawns are met in the country of their cell (`it.fails`, see Bugs found).
  - Every spawn, every wild meeting of any species beside any buddy, every level band any buddy lifts, every raid prize and every gift the staff schema admits is written inside the bounds the tables check.
- `test/fuzz/world/bounds.ts`: the bounds, read once from `db/migrations` and named (level 1 to 100, ivs 0 to 1073741823, slots 0 to 511, eight move slots, the `smallint` and `integer` columns of `encounters`).
- `test/fuzz/data/registries.test.ts` (in `pnpm test`), over every entry:
  - Family ids run from 0 with no gap, with one first stage each and one family per line.
  - Species and form ids decode and stay out of the shard band, and only Zenith Shards reach it.
  - Invented abilities sit above the engine's, and the engine's above the mainline.
  - Zenith shard ids decode back to their Zenith, one shard each.
  - No evolution line repeats a stage, and every line ends.
- `test/fuzz/data/yaml.test.ts` (in `pnpm test`): every YAML loader (species, moves, items, abilities, signatures, spawn pools) refuses a misspelt key anywhere in its files, in place of the key or beside it.
- Moves, behaviour unchanged: `stageEncounter` (`src/overworld/encounter/stage.ts`) out of the server's `startEncounter`; `readMapSky` and `readMapWindow` (`src/components/demo/weather-map-sky.ts`) out of `WeatherMap.tsx`. `ITEM_FAMILIES` is exported for the loader test.

## Breaking each property by hand

Each broken once, run, and put back (not committed):

- Map window half an hour off, map sky an hour ahead: both sky properties fail at chunk (0, 0).
- `getSpawnAt` reading x and y swapped, a spawn rolled from the next cell's pool: placement fails on the first chunk.
- `MAX_LEVEL` clamp taken out of `checkEncounterLevels`: the level band property fails at the first buddy with a fierce ability (Hustle). The random-chunk property alone did not find it in 100 runs.
- Totem prize level 101: raid prizes fail. Gift slots back to `COUNT`: gifts fail at slots 512.
- `DIAGONAL_PACE = 1`: the route property fails on one diagonal. A stranger's run timed as a straight pace a step: fails on one diagonal.
- Moves text and species stats schemas made non-strict: the loader property fails (`catch-rat` beside `catch-rate`).
- Families: Charmander's id given to Bulbasaur, Ivysaur's `evolves-from` removed, Stench made an engine ability, shard slots counted up instead of down, the line walk's claim guard removed: each fails its property.

## Bugs found

- Fixed: `STAFF_GIFT` and `COMMAND_GIFT` took packed slots as any count, and the caught rows stop at 511. Slots are now held to `MAX_PACKED_SLOTS`. Changeset `gift-slots-bound`.
- Fixed: a learnset level key that is not a level from 1 to 100 is refused (it used to file its moves under `NaN`).
- Fixed: a species part under a name `world/` lacks is refused (a misspelt `family-teachable` used to drop the family's shared machine moves).
- New node `meetings-cell-biome`: a meeting records the chunk's middle, not the country of its cell. Replay: live world, chunk (7, -572), surface, 1577836800000, zone 0, which records biome 14 for a spawn on a cell of biome 21.

## Checks

- `pnpm typecheck`: exit 0.
- `rtk proxy pnpm exec oxlint src test vitest.fuzz.ts`: exit 0.
- `pnpm fuzz`: 13 passed, 1 expected fail, 58 s.
- `FUZZ_RUNS=500` over `test/fuzz/world` under the fuzz config: 6 passed, 1 expected fail, 24 s.
- `pnpm test --maxWorkers=2`: 5855 passed (287 files).

## Size

- Estimated M, actual M. Three loader and schema fixes came out of it, and one node.
