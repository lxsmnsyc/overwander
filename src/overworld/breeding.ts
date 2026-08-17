import { MAX_IV, STAT_ORDER, type Stats, getIV, setIV } from '../data/constants/stats';
import EggGroups from '../data/ids/egg-groups';
import type { Moves } from '../data/ids/moves';
import type Natures from '../data/ids/natures';
import { Genders, Species } from '../data/ids/species';
import { MAX_LEVEL } from '../data/constants/levels';
import { getBaseSpecies, getEggMoves, getLevelUpMoves, getSpeciesData } from '../data/species';
import { MOVE_LIMIT, deriveMoves } from './encounter';

/**
 * Breeding: what two pokemon left with a breeder come to.
 *
 * All of it is decided here, from the two records and a roll stream,
 * so the same pair and the same stream always produce the same egg —
 * the server derives it once when it takes the fee, and nothing about
 * it can be asked for again.
 *
 * What an egg gets from its parents is what makes breeding worth
 * paying for: three of its six individual values are copied straight
 * off one parent or the other, the moves its line can only inherit
 * come from whichever parent actually knows them, and anything both
 * parents know that it would have grown into is handed to it now
 * instead. What it does not get is a level, a nature or an ability —
 * those are its own, rolled the way any hatchling's are.
 */

/**
 * How many of the six stats are copied from a parent rather than
 * rolled. Three is the mainline's own figure for a pair left alone
 * with nothing to hold
 */
export const INHERITED_IVS = 3;

/**
 * The odds a shadow parent passes the shadow on. It is a coin toss
 * rather than a certainty: a player breeding two shadows should not
 * be able to count on the result either way
 */
export const SHADOW_INHERITANCE_CHANCE = 0.5;

/**
 * What inheriting the shadow costs: an egg with something in it that
 * should not be there takes twice as long to open
 */
export const SHADOW_HATCH_FACTOR = 2;

/**
 * What breeding reads off a parent — a subset of a catch record, so
 * a caller can pass a stored catch straight in
 */
export interface BreedingParent {
  species: Species;
  gender: Genders;
  /**
   * The packed individual values, as the record stores them
   */
  ivs: number;
  moves: Moves[];
  shadow: boolean;
  /**
   * What this parent is, for an egg that inherits a nature rather
   * than rolling one
   */
  nature: Natures;
  /**
   * Whether this parent is holding an Everstone. A stone that keeps
   * its holder as it is does the same for what its holder passes on
   */
  everstone: boolean;
  /**
   * An egg is not a parent. It is listed here rather than checked by
   * the caller because it is the one refusal a player would
   * otherwise only find out about after paying
   */
  egg: boolean;
}

/**
 * Whether the species is Ditto, which breeds with almost anything
 * and passes on nothing of itself
 */
function isDitto(species: Species): boolean {
  return species === Species.Ditto;
}

/**
 * Whether the species can breed at all. The undiscovered group is
 * what the games put legendaries, mythicals and the unbreedable in
 */
function canLayEggs(species: Species): boolean {
  const groups = new Set(getSpeciesData(species).eggGroups);

  return groups.size > 0 && !groups.has(EggGroups.NoEggsDiscovered);
}

/**
 * Whether the two share an egg group. Ditto is exempt: its group is
 * itself, and it is compatible with everything that is not another
 * Ditto
 */
function sharesEggGroup(left: Species, right: Species): boolean {
  if (isDitto(left) || isDitto(right)) {
    return true;
  }

  const groups = new Set(getSpeciesData(left).eggGroups);

  return getSpeciesData(right).eggGroups.some((group) => groups.has(group));
}

/**
 * Whether the pair can produce an egg at all: opposite genders, or
 * one of them a Ditto. A genderless species has only the Ditto route,
 * and two Dittos have none
 */
function pairs(left: BreedingParent, right: BreedingParent): boolean {
  if (isDitto(left.species) && isDitto(right.species)) {
    return false;
  }
  if (isDitto(left.species) || isDitto(right.species)) {
    return true;
  }
  return (
    (left.gender === Genders.Male && right.gender === Genders.Female) ||
    (left.gender === Genders.Female && right.gender === Genders.Male)
  );
}

/**
 * What the pair would hatch: the first stage of the mother's line,
 * or of the non-Ditto parent's when a Ditto stands in for her.
 *
 * Answers null when the two cannot breed — the same pokemon twice, an
 * egg, a species with no eggs to discover, a mismatched pair of egg
 * groups, or two of the same gender
 */
export function getEggSpecies(left: BreedingParent, right: BreedingParent): Species | null {
  if (left.egg || right.egg) {
    return null;
  }
  if (!canLayEggs(left.species) || !canLayEggs(right.species)) {
    return null;
  }
  if (!sharesEggGroup(left.species, right.species) || !pairs(left, right)) {
    return null;
  }

  // The line comes from the mother; a Ditto passes on nothing of its
  // own, so the other parent's line is the one that continues
  if (isDitto(left.species)) {
    return getBaseSpecies(right.species);
  }
  if (isDitto(right.species)) {
    return getBaseSpecies(left.species);
  }
  return getBaseSpecies(left.gender === Genders.Female ? left.species : right.species);
}

/**
 * Whether the two can be left together at all
 */
export function canBreed(left: BreedingParent, right: BreedingParent): boolean {
  return getEggSpecies(left, right) != null;
}

/**
 * The egg's individual values: `INHERITED_IVS` of the six are copied
 * from one parent or the other, and the rest are rolled fresh. Which
 * stats are inherited, and which parent each comes from, are both
 * drawn from the stream — so two runs of the same pair are two
 * different pokemon
 */
export function inheritIVs(
  left: BreedingParent,
  right: BreedingParent,
  random: () => number,
): number {
  const pool = [...STAT_ORDER];
  const inherited = new Set<Stats>();

  for (let i = 0; i < INHERITED_IVS && pool.length > 0; i++) {
    const [stat] = pool.splice(Math.floor(random() * pool.length), 1);

    inherited.add(stat);
  }

  // The draws land in stat order: the parent it comes from for an
  // inherited stat, the value itself for a rolled one
  const valueOf = (stat: Stats): number =>
    inherited.has(stat)
      ? getIV((random() < 0.5 ? left : right).ivs, stat)
      : Math.floor(random() * (MAX_IV + 1));

  let ivs = 0;

  for (const stat of STAT_ORDER) {
    ivs = setIV(ivs, stat, valueOf(stat));
  }
  return ivs;
}

/**
 * The moves the hatchling comes out knowing, in the order they beat
 * each other to a slot.
 *
 * Two things come off the parents. Whatever its line can only inherit
 * and **either** parent knows is passed on — that is what makes
 * breeding a way to teach a move rather than a way to roll one. Then
 * anything **both** parents know that the species would have levelled
 * into anyway, which is how a hatchling comes out knowing a move years
 * before it is due one.
 *
 * The rest of the four is what the species knows at the level it
 * hatches
 */
export function inheritMoves(
  species: Species,
  left: BreedingParent,
  right: BreedingParent,
  level: number,
): Moves[] {
  const knownLeft = new Set(left.moves);
  const knownRight = new Set(right.moves);
  const known = new Set([...left.moves, ...right.moves]);
  const eggMoves = getEggMoves(species).filter((move) => known.has(move));
  const inherited = new Set(eggMoves);
  // Early is the whole point: a move the species is owed at level 40
  // is worth a slot at level 1, so it goes ahead of what it hatches
  // with rather than competing with it
  const shared = getLevelUpMoves(species, MAX_LEVEL).filter(
    (move) => knownLeft.has(move) && knownRight.has(move) && !inherited.has(move),
  );
  const passed = new Set([...eggMoves, ...shared]);

  // Inherited first, so they survive the four-move limit: they are
  // the ones the pair was put together for
  return [
    ...eggMoves,
    ...shared,
    ...deriveMoves(species, level).filter((move) => !passed.has(move)),
  ].slice(0, MOVE_LIMIT);
}

/**
 * Whether the egg carries a parent's shadow. Only a shadow parent can
 * pass one on, and even then only half the time
 */
export function inheritsShadow(
  left: BreedingParent,
  right: BreedingParent,
  random: () => number,
): boolean {
  return (left.shadow || right.shadow) && random() < SHADOW_INHERITANCE_CHANCE;
}

/**
 * The nature the egg inherits, or null when it rolls its own.
 *
 * An Everstone is the one thing a parent can hold that reaches the
 * egg: whoever is carrying it passes their nature down whole. Two
 * stones is two answers, and the pair is not sorted — the caller's
 * own roll picks between them, so a player breeding two Everstone
 * holders gets one of the two rather than always the first
 */
export function inheritNature(
  left: BreedingParent,
  right: BreedingParent,
  random: () => number,
): Natures | null {
  if (left.everstone && right.everstone) {
    return random() < 0.5 ? left.nature : right.nature;
  }
  if (left.everstone) {
    return left.nature;
  }
  if (right.everstone) {
    return right.nature;
  }
  return null;
}
