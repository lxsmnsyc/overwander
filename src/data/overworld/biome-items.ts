import * as v from 'valibot';
import type Biome from '../ids/biome';
import type { Items } from '../ids/items';
import { BIOME_IDS, ITEM_IDS } from '../ids/names';
import { idOf, idsOf } from '../yaml';
import groundFile from './biome-items.yaml';
import type Families from '../ids/families';
import { ZENITH_SHARDS } from '../items/zenith-shards';
import { getRegisteredSpecies, getSpeciesData } from '../species/__create';
import { ITEM_POOL, type ItemPoolEntry, type ItemRarityGroups } from './item-pool';

/**
 * Which ground hides what.
 *
 * [`ITEM_POOL`](./item-pool.ts) is the whole ladder and stays the one
 * place a band and its odds are read from. What is decided here is
 * only **where**: most of the shelf is buried everywhere, and the
 * things in `biome-items.yaml` belong to a landscape instead, so a stone is a reason
 * to cross the map rather than a slot in a table. The world is one
 * continuous map, so nothing here is out of anybody's reach.
 */

/**
 * The ground each item in `biome-items.yaml` belongs to. A lowercase
 * name there is one of the file's `groups`, laid down in its order
 */
const FILE = v.object({
  groups: v.record(v.string(), v.array(v.string())),
  items: v.record(v.string(), v.array(v.string())),
});

function readGroundItems(): [item: Items, biomes: Biome[]][] {
  const written = v.parse(FILE, groundFile);
  const groups = new Map<string, Biome[]>();

  for (const [name, biomes] of Object.entries(written.groups)) {
    groups.set(name, idsOf<Biome>(BIOME_IDS, biomes, `biome-items.yaml: groups: ${name}`));
  }

  const ground: [item: Items, biomes: Biome[]][] = [];

  for (const [name, places] of Object.entries(written.items)) {
    const where = `biome-items.yaml: ${name}`;
    const biomes: Biome[] = [];

    for (const place of places) {
      const group = groups.get(place);

      if (group == null) {
        biomes.push(idOf<Biome>(BIOME_IDS, place, where));
      } else {
        biomes.push(...group);
      }
    }
    ground.push([idOf<Items>(ITEM_IDS, name, where), biomes]);
  }
  return ground;
}

const GROUND_ITEMS = readGroundItems();

let homes: Map<Items, Set<Biome>> | null = null;

/**
 * Where each Zenith Shard is buried: wherever any stage of its line
 * is met, read off the species so a line moved to new ground takes
 * its shard along. A final stage is often met nowhere itself, and a
 * line met nowhere at all (a revived fossil) is buried everywhere
 */
function addZenithHomes(into: Map<Items, Set<Biome>>): void {
  const families = new Map<Families, Set<Biome>>();

  for (const species of getRegisteredSpecies()) {
    const data = getSpeciesData(species);
    const ground = families.get(data.family) ?? new Set<Biome>();

    for (const biome of data.biomes) {
      ground.add(biome);
    }
    families.set(data.family, ground);
  }
  for (const [item, shape] of ZENITH_SHARDS) {
    const ground = families.get(getSpeciesData(shape.base).family);

    if (ground != null && ground.size > 0) {
      into.set(item, ground);
    }
  }
}

/** Built the first time it is asked for, since the shards read the species registry */
function getHomes(): Map<Items, Set<Biome>> {
  if (homes == null) {
    homes = new Map();
    for (const [item, biomes] of GROUND_ITEMS) {
      homes.set(item, new Set(biomes));
    }
    addZenithHomes(homes);
  }
  return homes;
}

/** Which biomes hide this item, empty for one the whole world buries */
export function getItemBiomes(item: Items): Biome[] {
  return [...(getHomes().get(item) ?? [])];
}

/** Whether this ground hides this item, true for anything homeless */
export function isItemBuriedIn(item: Items, biome: Biome): boolean {
  const ground = getHomes().get(item);

  return ground == null || ground.has(biome);
}

const POOLS = new Map<Biome, ItemRarityGroups>();

function hereOnly(entries: ItemPoolEntry[], biome: Biome): ItemPoolEntry[] {
  const here: ItemPoolEntry[] = [];

  for (const entry of entries) {
    if (isItemBuriedIn(entry.item, biome)) {
      here.push(entry);
    }
  }
  return here;
}

/**
 * What a stash in this biome may hold: the shelf, less whatever
 * belongs to ground this is not.
 *
 * Weights are the shelf's, so an item is worth the same wherever it
 * is buried; what changes between biomes is which of them are in the
 * hat at all. Kept per biome once built, since a pool is read on
 * every cache a chunk rolls
 */
export function getItemPool(biome: Biome): ItemRarityGroups {
  const held = POOLS.get(biome);

  if (held != null) {
    return held;
  }

  const pool: ItemRarityGroups = {
    base: hereOnly(ITEM_POOL.base, biome),
    uncommon: hereOnly(ITEM_POOL.uncommon, biome),
    scarce: hereOnly(ITEM_POOL.scarce, biome),
    rare: hereOnly(ITEM_POOL.rare, biome),
    prized: hereOnly(ITEM_POOL.prized, biome),
    special: hereOnly(ITEM_POOL.special, biome),
  };

  POOLS.set(biome, pool);
  return pool;
}
