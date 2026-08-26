import { BIOME_NAMES, SPAWN_RARITY_NAMES, type SpeciesHabitat, TIMES_OF_DAY, TIME_OF_DAY_NAMES, listSpeciesHabitats } from '../../../data/biome';
import { Stats } from '../../../data/constants/stats';
import type Biome from '../../../data/ids/biome';
import type { Moves } from '../../../data/ids/moves';
import type { Species } from '../../../data/ids/species';
import { LAIR_NAMES, getBiomeLairs, getSpeciesLair } from '../../../data/overworld/lair';
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

  return Object.keys(level)
    .map(Number)
    .sort((one, other) => one - other)
    .map((threshold): [number, Moves[]] => [threshold, level[threshold]]);
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
  biome: Biome;
  /**
   * One badge per period it is met in — or a single **Anytime** badge
   * for something met around the clock at the same odds, which is most
   * of what lives anywhere. Four badges all saying the same thing is
   * four times the reading for the same fact
   */
  hours: string[];
}

export function groupHabitats(species: Species): Habitat[] {
  const places = new Map<Biome, SpeciesHabitat[]>();

  for (const habitat of listSpeciesHabitats(species)) {
    places.set(habitat.biome, [...(places.get(habitat.biome) ?? []), habitat]);
  }

  return [...places]
    .map(([biome, found]): Habitat => {
      const bands = new Map(found.map((habitat) => [habitat.time, habitat.rarity]));
      const met = TIMES_OF_DAY.filter((time) => bands.has(time));
      const rarities = new Set(met.map((time) => bands.get(time)));

      if (met.length === TIMES_OF_DAY.length && rarities.size === 1) {
        return { biome, hours: [`Anytime · ${SPAWN_RARITY_NAMES[bands.get(met[0]) ?? 0]}`] };
      }
      return {
        biome,
        hours: met.map(
          (time) => `${TIME_OF_DAY_NAMES[time]} · ${SPAWN_RARITY_NAMES[bands.get(time) ?? 0]}`,
        ),
      };
    })
    .sort((one, other) => BIOME_NAMES[one.biome].localeCompare(BIOME_NAMES[other.biome]));
}

/**
 * The place this species is at home in, if it has one, and the biomes
 * that place turns up in.
 *
 * A legendary is not caught by walking into it: it stands in a lair,
 * and a lair is a landmark the world stages in the biomes that could
 * hold it — the Seafoam Islands in cold water, Mt. Ember in a volcano.
 * Naming it is most of what a player needs, since a lair is what they
 * would travel to
 */
export function describeLair(species: Species): { name: string; where: string[] } | null {
  const lair = getSpeciesLair(species);

  if (lair == null) {
    return null;
  }

  const where = (Object.keys(BIOME_NAMES).map(Number) as Biome[]).filter((biome) =>
    new Set(getBiomeLairs(biome)).has(lair),
  );

  return { name: LAIR_NAMES[lair], where: where.map((biome) => BIOME_NAMES[biome]) };
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
