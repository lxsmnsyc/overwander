import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import registerGameData from '../../src/data';
import {
  TIMES_OF_DAY,
  type SpawnRarityGroups,
  getSpawnPool,
  getTownPool,
  hasSpawnPool,
  isLegendarySpecies,
  isMythicalSpecies,
  listSpeciesHabitats,
  listTownHabitats,
  pickSpawn,
  spawnOdds,
} from '../../src/data/biome';
import { BIOME_NAMES, TIME_OF_DAY_NAMES } from '../../src/data/biome/names';
import Biome, { SpawnSurface, type TimeOfDay } from '../../src/data/ids/biome';
import EggGroups from '../../src/data/ids/egg-groups';
import { FOSSIL_SPECIES } from '../../src/data/items/fossils';
import { HONEY_TREE_SPECIES } from '../../src/data/overworld/honey-tree';
import { Species } from '../../src/data/ids/species';
import { getRegisteredSpecies, getSpeciesData } from '../../src/data/species';
import { REGION_NAMES, getSpeciesRegion } from '../../src/data/species/regions';

registerGameData();

/** The most of a pool one species may be, so a walk is never mostly one thing */
const MOST_OF_A_POOL = 1 / 2;

/** How much more often an evolution may turn up than what it evolves from */
const EVOLUTION_LEEWAY = 1.5;

const SURFACES: [SpawnSurface, string][] = [
  [SpawnSurface.Land, 'land'],
  [SpawnSurface.Water, 'water'],
  [SpawnSurface.Ice, 'ice'],
];

/** Every pool a roll is made from: each biome's surfaces, the caves under it, and the towns */
function everyPool(): [where: string, pool: SpawnRarityGroups][] {
  const pools: [string, SpawnRarityGroups][] = [];

  for (const time of TIMES_OF_DAY) {
    const when = TIME_OF_DAY_NAMES[time];

    for (const biome of Object.keys(BIOME_NAMES)) {
      const id = Number(biome) as Biome;

      for (const [surface, name] of SURFACES) {
        if (hasSpawnPool(id, surface)) {
          pools.push([
            `${BIOME_NAMES[id]} ${name}, ${when}`,
            getSpawnPool(id, time, false, surface),
          ]);
        }
      }
      pools.push([`under ${BIOME_NAMES[id]}, ${when}`, getSpawnPool(id, time, true)]);
    }
    pools.push([`town, ${when}`, getTownPool(time as TimeOfDay)]);
  }
  return pools;
}

const POOLS = everyPool();

function isLegend(species: Species): boolean {
  return isLegendarySpecies(species) || isMythicalSpecies(species);
}

/** A baby comes from an egg rather than the wild, so it may be rarer than what it grows into */
function isBaby(species: Species): boolean {
  return getSpeciesData(species).eggGroups.includes(EggGroups.NoEggsDiscovered);
}

/** Every stage of the line a species starts */
function lineOf(first: Species): Species[] {
  const line = new Set([first]);

  // A set, since a form can evolve back into the shape it came from
  for (const stage of line) {
    for (const evolution of getSpeciesData(stage).evolvesInto ?? []) {
      line.add(evolution.species);
    }
  }
  return [...line];
}

/**
 * Counterparts placed together, so one waits on the other's sprite:
 * Passimian goes into the rainforest beside Oranguru, not before it
 */
const PLACED_WITH = new Map<Species, Species>([[Species.Passimian, Species.Oranguru]]);

function isDrawn(species: Species): boolean {
  return existsSync(`public/sprites/pokemon/${REGION_NAMES[getSpeciesRegion(species)]}/${species}`);
}

describe('spawn odds', () => {
  it('are what a roll actually stages', () => {
    const [, pool] = POOLS[0];
    const odds = spawnOdds(pool);
    const seen = new Map<Species, number>();
    const rolls = 20_000;
    let seed = 7;
    const random = (): number => {
      seed = (seed * 16_807) % 2_147_483_647;
      return seed / 2_147_483_647;
    };

    for (let roll = 0; roll < rolls; roll++) {
      const species = pickSpawn(pool, random);

      if (species != null) {
        seen.set(species, (seen.get(species) ?? 0) + 1);
      }
    }

    let total = 0;

    for (const [species, share] of odds) {
      total += share;
      if (share > 0.05) {
        expect((seen.get(species) ?? 0) / rolls).toBeCloseTo(share, 1);
      }
    }
    expect(total).toBeCloseTo(1, 6);
  });
});

describe('spawn balance', () => {
  it('never lets one species be most of what a pool stages', () => {
    const crowded: string[] = [];

    for (const [where, pool] of POOLS) {
      const odds = spawnOdds(pool);

      for (const [species, share] of odds) {
        if (share > MOST_OF_A_POOL && !isLegend(species)) {
          crowded.push(`${where}: ${getSpeciesData(species).name} ${(share * 100).toFixed(0)}%`);
        }
      }
    }
    expect(crowded).toEqual([]);
  });

  it('never meets an evolution much more often than what it evolves from', () => {
    const inverted: string[] = [];

    for (const [where, pool] of POOLS) {
      const odds = spawnOdds(pool);

      for (const [species, share] of odds) {
        const from = getSpeciesData(species).evolvesFrom;
        const before = from == null ? undefined : odds.get(from);

        if (from != null && before != null && !isBaby(from) && share > before * EVOLUTION_LEEWAY) {
          inverted.push(
            `${where}: ${getSpeciesData(species).name} ${(share * 100).toFixed(2)}% over ${getSpeciesData(from).name} ${(before * 100).toFixed(2)}%`,
          );
        }
      }
    }
    expect(inverted).toEqual([]);
  });

  it('gives every wild line somewhere to be met, once all of it is drawn', () => {
    const fossils = new Set<Species>(FOSSIL_SPECIES.values());
    const hatched = new Set<Species>();

    for (const species of getRegisteredSpecies()) {
      const egg = getSpeciesData(species).eggSpecies;

      if (egg != null) {
        hatched.add(egg);
      }
    }

    const unmet: string[] = [];

    for (const species of getRegisteredSpecies()) {
      const data = getSpeciesData(species);

      if (
        data.evolvesFrom != null ||
        data.baseForm === false ||
        data.worn === true ||
        isLegend(species) ||
        isBaby(species) ||
        // A line still waiting on a sprite is written into the pools it
        // will take as a comment, and placed once every stage is drawn
        !lineOf(species).every(isDrawn) ||
        !isDrawn(PLACED_WITH.get(species) ?? species)
      ) {
        continue;
      }
      if (
        listSpeciesHabitats(species).length === 0 &&
        listTownHabitats(species).length === 0 &&
        !HONEY_TREE_SPECIES.has(species) &&
        !fossils.has(species) &&
        !hatched.has(species)
      ) {
        unmet.push(data.name);
      }
    }
    expect(unmet).toEqual([]);
  });
});
