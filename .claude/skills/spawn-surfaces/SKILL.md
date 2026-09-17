---
name: spawn-surfaces
description: A spawn rolls from the pool of the surface under it (land, water or ice), and a species' habitat decides which of those pools may list it. Applies whenever adding or editing a spawn pool, a species' habitat or biomes, or how spawns are placed.
---

# Spawns stand on a surface

Every overworld cell is one of three surfaces (`Chunk.getCellSurface`, `SpawnSurface` in `src/data/ids/biome.ts`):

- **Land** is any cell that is not water. An open sea's islands are land.
- **Water** is a water cell in any biome, the open sea included.
- **Ice** is a water cell in a biome whose water is drawn frozen (`isIceBiome`: cold desert, taiga, tundra, alpine tundra and glacier). Ice is walked like ground.

A biome's file under `src/data/biome/` registers a pool per surface: `registerSpawnPool` for land, with `registerWaterPool` and `registerIcePool` beside it. A spawn draws its cell first and then rolls from that cell's pool, so a pond rolls what swims and an island rolls what walks. An ice cell in a biome with no ice pool rolls from the land pool, and a water cell in a biome with no water pool stays empty.

What reads a whole biome rather than one cell (raids, nests, trainers) reads `getBiomeRoster`, which is every surface's pool merged.

## Habitat decides the pool

A species' `habitat` (`Habitat` in `src/data/ids/species.ts`) is `Water`, `Amphibious`, or ground when the field is left out.

- A water-only species (fish, jellies, shellfish, whales) is listed only in water pools.
- A ground species is listed only in land and ice pools. A flier is ground unless its data says otherwise.
- An amphibious species may be listed in any pool, including both the land and water pools of one biome.

`fitsSurface` states the rule. Two tests in `test/data.test.ts` hold it: `writes every pool for the surface it stands on` fails on an entry in the wrong pool, and `gives every Water type a place in the water` fails when a new Water type is left without a habitat.

## Listing a species

An entry in a water or ice pool follows the same rules as a land one: the species' `biomes` names the biome, its `activeTimes` cover the period, and its band is the one `getSpawnRarity` gives it.
