import {
  BIOME_NAMES,
  SPAWN_RARITY_NAMES,
  type SpawnRarity,
  type SpeciesHabitat,
  TIMES_OF_DAY,
  TIME_OF_DAY_NAMES,
  listSpeciesHabitats,
  listTownHabitats,
} from '../../../data/biome';
import type { TimeOfDay } from '../../../data/ids/biome';
import { Stats } from '../../../data/constants/stats';
import type Biome from '../../../data/ids/biome';
import BiomeId from '../../../data/ids/biome';
import type { Moves } from '../../../data/ids/moves';
import type { Species } from '../../../data/ids/species';
import { LAIR_NAMES, getBiomeLairs, getSpeciesLairs } from '../../../data/overworld/lair';
import { getBaseForms, getSpeciesData } from '../../../data/species';

/**
 * The ceiling the stat bars are drawn against.
 *
 * A fixed one rather than the biggest stat on the page: a Shuckle's
 * defence should look enormous next to its attack *and* next to a
 * Pidgey's, which it does not if every entry rescales itself to its
 * own best number
 */
export const STAT_CEILING = 200;

/**
 * How long one turn on the spot takes, in milliseconds.
 *
 * The sheets spin at the speed a battle wants — a pokemon whipping
 * round mid-fight — which on a page that is being read is a fidget.
 * Four seconds is slow enough that each of the eight facings is
 * actually looked at, which is the point of turning at all
 */
export const ROTATION = 4000;

export const STAT_BARS: Record<Stats, string> = {
  [Stats.HP]: 'bg-leaf',
  [Stats.Attack]: 'bg-ember',
  [Stats.Defense]: 'bg-tide',
  [Stats.SpecialAttack]: 'bg-ember',
  [Stats.SpecialDefense]: 'bg-tide',
  [Stats.Speed]: 'bg-gold',
};

/**
 * Every level the species learns something at, in order, with what it
 * learns there
 */
export function listLevelMoves(species: Species): [level: number, moves: Moves[]][] {
  const { level } = getSpeciesData(species).learnSet;

  const thresholds: number[] = [];

  for (const key of Object.keys(level)) {
    thresholds.push(Number(key));
  }
  thresholds.sort((one, other) => one - other);

  const learnt: [level: number, moves: Moves[]][] = [];

  for (const threshold of thresholds) {
    learnt.push([threshold, level[threshold]]);
  }
  return learnt;
}

/**
 * One biome's worth of the habitat list: the hours it is met there,
 * each with how lucky the walk has to be.
 *
 * Grouped by **place** rather than by hour because that is the
 * question a player is asking — they are standing in a grassland and
 * want to know whether it is worth coming back at night
 */
interface Habitat {
  /** Null where it is met in every biome the world grows, alike */
  biome: Biome | null;
  /**
   * One badge per period it is met in — or a single **Anytime** badge
   * for something met around the clock at the same odds, which is most
   * of what lives anywhere. Four badges all saying the same thing is
   * four times the reading for the same fact
   */
  hours: string[];
}

/** How many biomes the world actually grows: every one but Beyond, which is only a record's origin */
function worldBiomeCount(): number {
  const beyond: number = BiomeId.Beyond;
  let count = 0;

  for (const key of Object.keys(BIOME_NAMES)) {
    if (Number(key) !== beyond) {
      count += 1;
    }
  }
  return count;
}

export function groupHabitats(species: Species): Habitat[] {
  const places = new Map<Biome, SpeciesHabitat[]>();

  for (const habitat of listSpeciesHabitats(species)) {
    places.set(habitat.biome, [...(places.get(habitat.biome) ?? []), habitat]);
  }

  const habitats: Habitat[] = [];

  for (const [biome, found] of places) {
    habitats.push({ biome, hours: hourBadges(found) });
  }
  // Every biome at the same hours is one fact, not thirty rows of it
  if (habitats.length > 0 && habitats.length === worldBiomeCount()) {
    const first = habitats[0].hours.join('|');
    let alike = true;

    for (const habitat of habitats) {
      if (habitat.hours.join('|') !== first) {
        alike = false;
        break;
      }
    }
    if (alike) {
      return [{ biome: null, hours: habitats[0].hours }];
    }
  }
  return habitats.sort((one, other) =>
    BIOME_NAMES[one.biome ?? 0].localeCompare(BIOME_NAMES[other.biome ?? 0]),
  );
}

/** The badges for the hours something is met, collapsed to Anytime when every hour reads the same */
function hourBadges(found: { time: TimeOfDay; rarity: SpawnRarity }[]): string[] {
  const bands = new Map<TimeOfDay, SpawnRarity>();

  for (const habitat of found) {
    bands.set(habitat.time, habitat.rarity);
  }

  const met: TimeOfDay[] = [];
  const rarities = new Set<SpawnRarity | undefined>();

  for (const time of TIMES_OF_DAY) {
    if (bands.has(time)) {
      met.push(time);
      rarities.add(bands.get(time));
    }
  }
  if (met.length === TIMES_OF_DAY.length && rarities.size === 1) {
    return [`Anytime · ${SPAWN_RARITY_NAMES[bands.get(met[0]) ?? 0]}`];
  }

  const badges: string[] = [];

  for (const time of met) {
    badges.push(`${TIME_OF_DAY_NAMES[time]} · ${SPAWN_RARITY_NAMES[bands.get(time) ?? 0]}`);
  }
  return badges;
}

/** The hours this species is met on a town's streets, as badges */
export function townHours(species: Species): string[] {
  return hourBadges(listTownHabitats(species));
}

/**
 * The places this species is at home in, and the biomes each turns up
 * in.
 *
 * A legendary is not caught by walking into it: it stands in a lair,
 * and a lair is a landmark the world stages in the biomes that could
 * hold it — the Seafoam Islands in cold water, Mt. Ember in a volcano.
 * Naming it is most of what a player needs, since a lair is what they
 * would travel to
 */
export function describeLairs(species: Species): { name: string; where: string[] }[] {
  const lairs: { name: string; where: string[] }[] = [];

  for (const lair of getSpeciesLairs(species)) {
    const where: string[] = [];

    for (const key of Object.keys(BIOME_NAMES)) {
      const biome: Biome = Number(key);

      if (new Set(getBiomeLairs(biome)).has(lair)) {
        where.push(BIOME_NAMES[biome]);
      }
    }
    lairs.push({ name: LAIR_NAMES[lair], where });
  }
  return lairs;
}

/**
 * The dex in the order it is printed. Base forms only — a dex is one
 * entry per pokemon rather than one per costume — and the arrows walk
 * this list
 */
export function dexOrder(): Species[] {
  return getBaseForms().sort(
    (one, other) => getSpeciesData(one).dexNumber - getSpeciesData(other).dexNumber,
  );
}
