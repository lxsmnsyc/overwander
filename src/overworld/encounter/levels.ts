import { SpawnRarity, countLineStages, getLineStage, getSpawnRarity } from '../../data/biome';
import { EvolutionMethod } from '../../data/ids/species';
import type { Species } from '../../data/ids/species';
import type { EvolutionData } from '../../data/species';
import { getSpeciesData } from '../../data/species';
import { TRAIT_MASK, TRAIT_RANGE } from './bits';

/** What level a wild pokemon is met at */
/**
 * What a baby or an unown is met at: they are rare to find rather
 * than far along, so they are the youngest thing in the grass
 */
export const PRIZED_SPAWN_LEVELS: [minimum: number, maximum: number] = [5, 10];

/**
 * A legendary covers the whole range on purpose: there is one of each
 * in the world, and one that could only be met at a known strength is
 * a legendary with a known answer
 */
export const SPECIAL_SPAWN_LEVELS: [minimum: number, maximum: number] = [1, 100];

/** What a species that never evolves at all is met at */
export const SINGLE_SPAWN_LEVELS: [minimum: number, maximum: number] = [10, 50];

/**
 * Where a stage starts when nothing in its line names a level: a
 * stone, a trade or an evolution a later gen holds
 */
const UNNAMED_FLOOR = 30;

/** As high as the wild goes, short of a legendary */
const GROWN_CEILING = 60;

/** As high as anything that is not the end of its line goes */
const HALF_GROWN_CEILING = 50;

/** The first stage of any line starts here */
const YOUNG_FLOOR = 5;

/** Where a first stage stops when nothing names the level it evolves at */
const YOUNG_CEILING = 30;

/** The highest level named on a set of evolution roads, if any names one */
function namedLevel(roads: EvolutionData[]): number | null {
  const levels = roads
    .filter((road) => (road.method & EvolutionMethod.Level) !== 0 && road.level != null)
    .map((road) => road.level ?? 0);

  return levels.length === 0 ? null : Math.max(...levels);
}

/** The level this pokemon is handed over at, if it is reached by one */
function arrivalLevel(species: Species): number | null {
  const from = getSpeciesData(species).evolvesFrom;

  if (from == null) {
    return null;
  }
  return namedLevel(
    (getSpeciesData(from).evolvesInto ?? []).filter((road) => road.species === species),
  );
}

/**
 * What level a wild pokemon may be: where it stands in its line, and
 * the levels its line names.
 *
 * A stage is met between the level it can first exist at and the
 * level it stops being itself at, so a Charmander is 5 to 16, a
 * Charmeleon 16 to 36 and a Charizard 36 to 60. Where no level is
 * named, because the next step is a stone or a trade or an evolution
 * a later gen holds, the stage takes the flat range for its place in
 * the line instead
 */
export function getSpawnLevels(species: Species): [minimum: number, maximum: number] {
  const rarity = getSpawnRarity(species);

  if (rarity === SpawnRarity.Special || rarity === SpawnRarity.Mythical) {
    return SPECIAL_SPAWN_LEVELS;
  }
  if (rarity === SpawnRarity.Prized) {
    return PRIZED_SPAWN_LEVELS;
  }

  const stages = countLineStages(species);

  if (stages === 1) {
    return SINGLE_SPAWN_LEVELS;
  }

  const at = getLineStage(species);
  const next = namedLevel(getSpeciesData(species).evolvesInto ?? []);
  const arrived = arrivalLevel(species);

  // A first stage is always young, and stops where its evolution
  // starts
  if (at === 1) {
    return [YOUNG_FLOOR, next ?? YOUNG_CEILING];
  }
  // The middle of a three-stage line: from where it arrived to where
  // it leaves, unless it leaves by something that is not a level
  if (at === 2 && stages >= 3) {
    return next == null
      ? [UNNAMED_FLOOR, HALF_GROWN_CEILING]
      : [arrived ?? UNNAMED_FLOOR, Math.max(arrived ?? UNNAMED_FLOOR, next)];
  }
  // The end of a two-stage line has nothing above it to stop at, so
  // it stops short of the ceiling a longer line earns
  if (at === 2) {
    return [arrived ?? UNNAMED_FLOOR, HALF_GROWN_CEILING];
  }
  return [arrived ?? UNNAMED_FLOOR, GROWN_CEILING];
}

/**
 * The level a spawn rolls inside a band. It is the same arithmetic
 * the encounter does, exported so a lineup can be priced before the
 * fight is staged
 */
export function levelInBand(
  traitValue: number,
  [lowest, highest]: [minimum: number, maximum: number],
): number {
  return lowest + Math.floor(((traitValue & TRAIT_MASK) / TRAIT_RANGE) * (highest - lowest + 1));
}
