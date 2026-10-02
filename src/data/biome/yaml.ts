import * as v from 'valibot';
import Biome, { TimeOfDay } from '../ids/biome';
import { BIOME_IDS, SPECIES_IDS } from '../ids/names';
import type { Species } from '../ids/species';
import { idOf } from '../yaml';
import {
  PRIZED_WEIGHT,
  SPAWN_BAND_KEYS,
  type SpawnEntry,
  type SpawnPool,
  type SpawnRarityGroups,
  UNOWN_SPAWNS,
  registerCaveLegends,
  registerCavePool,
  registerIcePool,
  registerSpawnPool,
  registerTownPool,
  registerWaterPool,
} from './__create';

/**
 * The spawn pools, read out of their YAML: a file per biome under
 * `pools/`, plus `cave.yaml` and `town.yaml` for the two pools that
 * are not a biome's own.
 *
 * A biome's file holds a pool per surface it has (`land`, `water`,
 * `ice`), each a pool per time of day, each a set of rarity bands from
 * species to weight, and the `cave-legends` met in the caves under it.
 * Two times that see the same pool write it once and point at it
 * (`day: *land-morning`).
 *
 * The order a band is written in is the order a roll walks it, so
 * moving a line moves which species a given roll lands on. `prized`
 * is the weight every prized species shares, and `Unown: forms` puts
 * down each Unown form at weight 1
 */

const NAME = v.string();

const WEIGHT = v.union([
  v.pipe(v.number(), v.minValue(0)),
  v.literal('prized'),
  v.literal('forms'),
]);

const BAND = v.record(NAME, WEIGHT);

const GROUPS = v.object({
  base: BAND,
  uncommon: BAND,
  rare: BAND,
  scarce: v.optional(BAND),
  elusive: v.optional(BAND),
  prized: v.optional(BAND),
  special: BAND,
  mythical: v.optional(BAND),
});

const TIMES = v.object({ morning: GROUPS, day: GROUPS, evening: GROUPS, night: GROUPS });

const BIOME_FILE = v.object({
  land: v.optional(TIMES),
  water: v.optional(TIMES),
  ice: v.optional(TIMES),
  'cave-legends': v.optional(BAND),
});

const SHARED_FILE = v.object({ pool: TIMES });

function readBand(band: v.InferOutput<typeof BAND>, where: string): SpawnEntry[] {
  const entries: SpawnEntry[] = [];

  for (const [name, weight] of Object.entries(band)) {
    if (weight === 'forms') {
      if (name !== 'Unown') {
        throw new Error(`${where}: only Unown is written as forms`);
      }
      entries.push(...UNOWN_SPAWNS);
    } else {
      entries.push({
        species: idOf<Species>(SPECIES_IDS, name, where),
        weight: weight === 'prized' ? PRIZED_WEIGHT : weight,
      });
    }
  }
  return entries;
}

function readGroups(groups: v.InferOutput<typeof GROUPS>, where: string): SpawnRarityGroups {
  const read: SpawnRarityGroups = { base: [], uncommon: [], rare: [], special: [] };

  // In the bands' own order, the way a pool written in code listed them
  for (const band of SPAWN_BAND_KEYS) {
    const written = groups[band];

    if (written != null) {
      read[band] = readBand(written, `${where}: ${band}`);
    } else {
      delete read[band];
    }
  }
  return read;
}

function readPool(times: v.InferOutput<typeof TIMES>, where: string): SpawnPool {
  return {
    [TimeOfDay.Morning]: readGroups(times.morning, `${where}: morning`),
    [TimeOfDay.Day]: readGroups(times.day, `${where}: day`),
    [TimeOfDay.Evening]: readGroups(times.evening, `${where}: evening`),
    [TimeOfDay.Night]: readGroups(times.night, `${where}: night`),
  };
}

/** A file's biome, from its name: `deep-ocean.yaml` is the Deep Ocean */
function biomeOf(path: string): Biome {
  const name = path.slice(path.lastIndexOf('/') + 1, -'.yaml'.length);
  let pascal = '';

  for (const word of name.split('-')) {
    pascal += word.slice(0, 1).toUpperCase() + word.slice(1);
  }
  return idOf<Biome>(BIOME_IDS, pascal, path);
}

/** Every pool the files write, registered where it belongs */
export default function registerPools(files: Record<string, unknown>): void {
  for (const [path, file] of Object.entries(files)) {
    if (path.endsWith('/cave.yaml')) {
      registerCavePool(readPool(v.parse(SHARED_FILE, file).pool, path));
      continue;
    }
    if (path.endsWith('/town.yaml')) {
      registerTownPool(readPool(v.parse(SHARED_FILE, file).pool, path));
      continue;
    }

    const biome = biomeOf(path);
    const written = v.parse(BIOME_FILE, file);

    if (written.land != null) {
      registerSpawnPool(biome, readPool(written.land, `${path}: land`));
    }
    if (written.water != null) {
      registerWaterPool(biome, readPool(written.water, `${path}: water`));
    }
    if (written.ice != null) {
      registerIcePool(biome, readPool(written.ice, `${path}: ice`));
    }
    if (written['cave-legends'] != null) {
      registerCaveLegends(biome, readBand(written['cave-legends'], `${path}: cave-legends`));
    }
  }
}
