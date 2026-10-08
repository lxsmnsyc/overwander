---
name: spawn-surfaces
description: Each surface of a biome draws from its own pool, cut to what can stand there, and a surface with no pool of its own draws from the land pool. A species' kind (ground, water or flying) decides which surfaces it stands on, and only an amphibious water species leaves the water. Applies whenever adding or editing a spawn pool, a species' habitat, egg groups or biomes, or how spawns and phenomena are placed.
---

# Spawns stand on a surface

Every overworld cell is one of three surfaces (`Chunk.getCellSurface`, `SpawnSurface` in `src/data/ids/biome.ts`):

- **Land** is any cell that is not water. An open sea's islands are land.
- **Water** is a water cell in any biome, the open sea included.
- **Ice** is a water cell in a biome whose water is drawn frozen (`isIceBiome`). Ice is walked like ground.

## A pool per surface, cut by what stands there

A biome's file in `src/data/biome/pools/` holds a `land` pool and may hold `water` and `ice` pools. A cell draws from **its own surface's pool**, cut to what can stand on that surface (`getSpawnPool`), so a water pool lists everything met on water and its weights are shares of water rolls. Nothing is borrowed from another surface.

A surface with no pool of its own draws from the land pool, cut the same way: a lake in a field meets the field's swimmers and fliers. Ice with no pool of its own is walked like land outright (`drawnSurface` in `chunk-snapshot.ts`), and a volcano's water is lava that nothing stands on.

`getBiomeRoster` still merges a biome's surfaces, a species listed twice counting once at its heavier weight, for what reads a biome as a whole: the dex's habitats, the egg pool, the landmarks' ranks.

## Three kinds

`getSpawnClass` sorts every species, in this order:

- **Flying**: Flying type, the Flying egg group, or Levitate in its ability pool. Stands on ground and water alike.
- **Water**: Water type, or the Water 1, 2 or 3 egg group. Stands only on water, unless its `habitat` is `Amphibious`, which lets it onto ground and ice as well.
- **Ground**: everything else. Stands only on ground and ice.

Two hand-picked lists in `src/data/biome/__create.ts` override the rules: `WATER_ONLY_FLIERS` (Gyarados, Mantine, Mantyke) are water rather than flying, and `DRY_LAND_SPECIES` (Skorupi, Drapion) are ground despite their egg group. Add to them rather than bending the rules.

`fitsSurface` states the placement rule. Caves cut their own pool the same way.

## Phenomena draw from a kind

Rippling water startles the water kind, a flying shadow the flying kind and a dust cloud the ground kind (`getClassPool`), whatever surface the landmark stands on. A grotto takes whatever stands on the ground.

## Amphibious

`habitat: Amphibious` (in the species' `world/` YAML) only matters for the water kind. Mark a water species amphibious when it is met on land as readily as in the water: frogs, turtles, crabs, otters, seals, the water starters. Fish, jellies, shellfish and whales stay water-only, and so does a water species with no habitat at all.
