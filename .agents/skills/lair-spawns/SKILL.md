---
name: lair-spawns
description: A legendary lair is also a wild spawn. Applies whenever adding, moving or removing a lair, a legendary's biomes, or a legendary in a biome's spawn pool.
---

# A lair is a wild spawn

**Every biome that hosts a legendary lair stages each of that lair's residents in its own spawn pool.** A player who finds a lair in a biome can also meet its legendary walking that biome, and the dex lists both.

The lairs a biome hosts are `BIOME_LAIRS` in [`src/data/overworld/lair.ts`](../../../src/data/overworld/lair.ts). The pools are the files under [`src/data/biome/`](../../../src/data/biome/).

## What it takes

For each biome in a lair's host list, and each resident of that lair:

- the resident sits in that biome's `special` band at weight 10, in every period its `activeTimes` covers,
- the resident's own `biomes` list names that biome, since a pool may only stage a species that says it lives there.

Adding a lair to a biome means adding those spawns in the same change. When a spawn is unwanted, take the lair out of that biome instead. Never leave one without the other.

## Mythicals are the exception

A mythical's lair is never hosted by a biome: a relic is the only way into one, and `getBiomeLairs` filters them out. A mythical still spawns in its home biome, through that biome's `mythical` band, with no lair involved.

## The test

`stages a legendary wild wherever its lair stands` in `test/data.test.ts` walks every hosted lair and fails on any resident missing from the biome's special band. The rule only runs one way: a legendary may spawn in a biome that hosts none of its lairs.
