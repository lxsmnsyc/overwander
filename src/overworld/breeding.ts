import { MAX_IV, STAT_ORDER, type Stats, getIV, setIV } from '../data/constants/stats';
import type Abilities from '../data/ids/abilities';
import EggGroups from '../data/ids/egg-groups';
import { Balls } from '../data/ids/items';
import type { Moves } from '../data/ids/moves';
import type Natures from '../data/ids/natures';
import { Genders, Species } from '../data/ids/species';
import { MAX_LEVEL } from '../data/constants/levels';
import {
  getBaseSpecies,
  getEggMoves,
  getLevelUpMoves,
  getSpeciesAbilityPools,
  getSpeciesData,
} from '../data/species';
import { MOVE_LIMIT, deriveMoves } from './encounter';

/**
 * Breeding: what two pokemon left with a breeder come to.
 *
 * Decided here from the two records and a roll stream, so the same
 * pair and stream always produce the same egg. The server derives it
 * once as it takes the fee, and it cannot be asked for again.
 *
 * The egg copies three of its six individual values off a parent,
 * inherits the moves its line can only learn that way, and is laid in
 * its mother's ball with her ability most of the time. Three held
 * items reach it rather than a fight: an Everstone passes its holder's
 * nature, a Destiny Knot copies five values, and a power item names
 * one stat and copies it outright
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
 * How many of the six an egg copies when a parent is wearing a
 * Destiny Knot. Five of six is the mainline's figure, and it is what
 * turns breeding from a way to improve a line into a way to finish one
 */
export const DESTINY_KNOT_IVS = 5;

/**
 * The odds the egg takes the mother's ability slot rather than rolling
 * its own, and the lower odds for a hidden one. Both are the
 * mainline's, and the gap between them is what keeps a hidden ability
 * worth chasing after the first one is bred
 */
export const ABILITY_INHERITANCE_CHANCE = 0.8;
export const HIDDEN_ABILITY_INHERITANCE_CHANCE = 0.6;

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
   * The ability this parent actually has, which the egg may take a
   * copy of rather than rolling one
   */
  ability: Abilities;
  /**
   * The ball this parent was caught in, which the egg is laid into
   */
  ball: Balls;
  /**
   * Whether this parent is holding a Destiny Knot, which copies five
   * of the six individual values instead of three
   */
  destinyKnot: boolean;
  /**
   * The stat this parent's power item names, or null when it is not
   * holding one. That stat is copied off this parent whatever else
   * the draws say
   */
  powerStat: Stats | null;
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
 * The parent the egg is laid by: the mother, or whichever of the two
 * is not a Ditto when one stands in for her. Everything an egg takes
 * from one parent rather than either — its line, its ability, the ball
 * it is laid into — comes from this one.
 *
 * Answers null for a pair with no mother between them, which is a pair
 * that cannot breed at all
 */
function getMother(left: BreedingParent, right: BreedingParent): BreedingParent | null {
  if (isDitto(left.species)) {
    return isDitto(right.species) ? null : right;
  }
  if (isDitto(right.species)) {
    return left;
  }
  if (left.gender === Genders.Female) {
    return left;
  }
  return right.gender === Genders.Female ? right : null;
}

/**
 * The lines that lay either of two species. Nidoran is one line in
 * everything but the registry: the two halves are separate species
 * under separate families, so which one is in the shell has to be
 * rolled rather than read off the mother
 */
const NIDORAN: [Species, Species] = [Species.NidoranF, Species.NidoranM];

const GENDER_SPECIES: Map<Species, [Species, Species]> = new Map([
  [Species.NidoranF, NIDORAN],
  [Species.NidoranM, NIDORAN],
]);

/**
 * Which half of a two-species line the egg turned out to be, for the
 * lines that have halves. Everything else is itself
 */
export function rollEggSpecies(species: Species, random: () => number): Species {
  const halves = GENDER_SPECIES.get(species);

  return halves == null ? species : halves[random() < 0.5 ? 0 : 1];
}

/**
 * What the pair would hatch: the first stage of the mother's line,
 * or of the non-Ditto parent's when a Ditto stands in for her.
 *
 * A line with two halves answers the half the mother is; `rollEggSpecies`
 * is what decides the egg's own, and is left to the caller so that
 * asking whether a pair *can* breed does not need a roll.
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

  const mother = getMother(left, right);

  return mother == null ? null : getBaseSpecies(mother.species);
}

/**
 * Whether the two can be left together at all
 */
export function canBreed(left: BreedingParent, right: BreedingParent): boolean {
  return getEggSpecies(left, right) != null;
}

/**
 * The egg's individual values. Three of the six are copied from one
 * parent or the other — five if either is wearing a Destiny Knot — and
 * the rest are rolled fresh. Which stats are copied, and which parent
 * each comes from, are both drawn from the stream, so two runs of the
 * same pair are two different pokemon.
 *
 * A power item is the exception a player can aim with: the stat it
 * names is copied off its holder rather than drawn for, and it counts
 * against the three or five. Two power items is still one forced stat
 * — the draw picks whose — so a pair cannot lock down two at once
 */
export function inheritIVs(
  left: BreedingParent,
  right: BreedingParent,
  random: () => number,
): number {
  const copies = left.destinyKnot || right.destinyKnot ? DESTINY_KNOT_IVS : INHERITED_IVS;
  const holders: [BreedingParent, Stats][] = [];
  const forced = new Map<Stats, BreedingParent>();

  for (const parent of [left, right]) {
    if (parent.powerStat != null) {
      holders.push([parent, parent.powerStat]);
    }
  }
  if (holders.length > 0) {
    // The first draw, and only when somebody is holding one: a pair
    // with no power item between them rolls exactly as it always did
    const [holder, stat] = holders.length === 1 ? holders[0] : holders[random() < 0.5 ? 0 : 1];

    forced.set(stat, holder);
  }

  const pool = STAT_ORDER.filter((stat) => !forced.has(stat));
  const inherited = new Set<Stats>();

  for (let i = forced.size; i < copies && pool.length > 0; i++) {
    const [stat] = pool.splice(Math.floor(random() * pool.length), 1);

    inherited.add(stat);
  }

  // The draws land in stat order: the parent it comes from for a
  // copied stat, the value itself for a rolled one. A forced stat
  // draws nothing, since its parent is already known
  const valueOf = (stat: Stats): number => {
    const holder = forced.get(stat);

    if (holder != null) {
      return getIV(holder.ivs, stat);
    }
    return inherited.has(stat)
      ? getIV((random() < 0.5 ? left : right).ivs, stat)
      : Math.floor(random() * (MAX_IV + 1));
  };

  let ivs = 0;

  for (const stat of STAT_ORDER) {
    ivs = setIV(ivs, stat, valueOf(stat));
  }
  return ivs;
}

/**
 * The ability the egg inherits, or null when it rolls its own.
 *
 * It comes off the mother, most of the time but not all of it, and a
 * hidden one comes across less often than an ordinary one — so a
 * player breeding toward a hidden ability is working at it rather than
 * doing it once. An ability the egg's own line has never had is not
 * passed at all, which is what a cross-group pair can otherwise leave
 * the mother holding
 */
export function inheritAbility(
  species: Species,
  left: BreedingParent,
  right: BreedingParent,
  random: () => number,
): Abilities | null {
  const mother = getMother(left, right);

  if (mother == null) {
    return null;
  }

  const pools = getSpeciesAbilityPools(species);
  const hidden = new Set(pools.hidden);
  const regular = new Set(pools.regular);

  if (!hidden.has(mother.ability) && !regular.has(mother.ability)) {
    return null;
  }
  const chance = hidden.has(mother.ability)
    ? HIDDEN_ABILITY_INHERITANCE_CHANCE
    : ABILITY_INHERITANCE_CHANCE;

  return random() < chance ? mother.ability : null;
}

/**
 * The balls an egg is never laid into. A Master Ball is worth more
 * than anything a player would put in one, and breeding is not a way
 * to make more of them
 */
const UNINHERITABLE_BALLS: Set<Balls> = new Set([Balls.MasterBall]);

/**
 * The ball the egg is laid into: the mother's own, so a player who
 * caught her in something they liked gets a line of them. It matters
 * beyond the picture — a Luxury Ball's comfort is what a hatchling
 * gains friendship at
 */
export function inheritBall(left: BreedingParent, right: BreedingParent): Balls {
  const mother = getMother(left, right);

  if (mother == null || UNINHERITABLE_BALLS.has(mother.ball)) {
    return Balls.PokeBall;
  }
  return mother.ball;
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
