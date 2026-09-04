import Abilities from '../ids/abilities';
import { MoveCategories, MoveFlags, Moves } from '../ids/moves';
import { Stats } from '../constants/stats';
import type { Species } from '../ids/species';
import { TYPE_EFFECTIVENESS, TypeEffectiveness, Types } from '../constants/types';
import { getLearnableMoves, getSpeciesData } from './__create';
import { getMoveData } from '../moves/__create';

/**
 * What a species is best built as: the four moves an expert's copy of
 * it fights with, worked out rather than written down.
 *
 * Everything staged from a spawn otherwise carries the last four
 * level-up moves it knows, which at the top of the ladder is the tail
 * of a learnset: often four moves of one type, sometimes mostly
 * status. This picks from everything the species can ever learn, and
 * weighs each candidate by what the pokemon holding it actually is,
 * its types, which of its two attacking stats is the real one, and
 * the ability it fights with.
 *
 * Derived rather than tabled so that a species added in a later
 * generation is built the moment it is registered. Where the scoring
 * reads one wrong, `BEST_MOVE_OVERRIDES` is what says so.
 */

/** How many moves one of these carries */
export const BEST_MOVE_COUNT = 4;

/**
 * A move's worth is read as effective power, so everything below is
 * on the same scale a base power is: 100 is a strong hit landing
 * every time with nothing helping it
 */
const NEUTRAL_ACCURACY = 100;

/**
 * What a move that deals no damage is worth a slot for. Only the ones
 * that change a fight rather than decorate it, since a party fielding
 * two of these is a party that does not attack.
 *
 * They are priced against the attacks they displace: a stat-doubling
 * setup beats a mid attack, a heal matches one, and a crippling
 * status sits just under
 */
const STATUS_WORTH: Partial<Record<Moves, number>> = {
  // Setup: what a pokemon spends its first cast on when the rest of
  // the fight is worth more for it
  [Moves.SwordsDance]: 120,
  [Moves.DragonDance]: 120,
  [Moves.TailGlow]: 120,
  [Moves.CalmMind]: 115,
  [Moves.BellyDrum]: 110,
  [Moves.BulkUp]: 110,
  [Moves.Agility]: 85,
  [Moves.Growth]: 90,
  [Moves.Amnesia]: 90,
  [Moves.IronDefense]: 88,
  [Moves.CosmicPower]: 86,
  [Moves.DoubleTeam]: 85,

  // Health back, which is worth about what a hit takes off
  [Moves.Recover]: 105,
  [Moves.SoftBoiled]: 105,
  [Moves.MilkDrink]: 105,
  [Moves.SlackOff]: 105,
  [Moves.Synthesis]: 95,
  [Moves.MorningSun]: 95,
  [Moves.Moonlight]: 95,
  [Moves.Wish]: 85,

  // And taking somebody out of the fight without hitting them
  [Moves.Spore]: 115,
  [Moves.SleepPowder]: 100,
  [Moves.ThunderWave]: 100,
  [Moves.WillOWisp]: 100,
  [Moves.Toxic]: 85,
  [Moves.LeechSeed]: 100,
  [Moves.Substitute]: 80,
  [Moves.Glare]: 95,
  [Moves.StunSpore]: 95,
  [Moves.Screech]: 90,
  [Moves.Reflect]: 90,
  [Moves.LightScreen]: 90,
  [Moves.LovelyKiss]: 90,
  [Moves.Hypnosis]: 85,
  [Moves.Encore]: 85,
  [Moves.Taunt]: 85,
  [Moves.ConfuseRay]: 85,
  [Moves.Protect]: 85,
};

/**
 * Which half of the split a setup move serves, so a Dragon Dance is
 * not offered to something that never swings and a Calm Mind is not
 * offered to something that never blasts. The ones that raise a
 * defence or a speed serve either, and are absent
 */
const SETUP_CATEGORY: Partial<Record<Moves, MoveCategories>> = {
  [Moves.SwordsDance]: MoveCategories.Physical,
  [Moves.BellyDrum]: MoveCategories.Physical,
  [Moves.BulkUp]: MoveCategories.Physical,
  [Moves.DragonDance]: MoveCategories.Physical,
  [Moves.CalmMind]: MoveCategories.Special,
  [Moves.TailGlow]: MoveCategories.Special,
  [Moves.Growth]: MoveCategories.Special,
};

/**
 * How much a type opens up, from what it hits for double. Normal
 * reaches nothing at all and Ground reaches five, and a move is worth
 * what it lets its holder reach as well as what it hits for
 */
const COVERAGE_FLOOR = 0.8;
const COVERAGE_STEP = 0.06;

const COVERAGE = new Map<Types, number>();

function coverageWeight(type: Types): number {
  const known = COVERAGE.get(type);

  if (known != null) {
    return known;
  }

  const reach = Object.values(TYPE_EFFECTIVENESS[type]).filter(
    (effect) => effect === TypeEffectiveness.Effective,
  ).length;
  const weight = COVERAGE_FLOOR + COVERAGE_STEP * reach;

  COVERAGE.set(type, weight);
  return weight;
}

/**
 * What a move costs beyond what its entry says.
 *
 * Power, accuracy and wind-up steps are all in a move's data, so
 * nothing that is only those appears here. What is left is the moves
 * whose whole character is a drawback the registry has no field for:
 * a recharge, a recoil, a condition that has to already be true. A
 * factor of 0 is a move an expert is never built with
 */
const MOVE_DRAWBACKS: Partial<Record<Moves, number>> = {
  // The pokemon is not there afterwards, which no amount of power
  // pays for on a team of three
  [Moves.Explosion]: 0,
  [Moves.SelfDestruct]: 0,

  // Landing one and then standing still for the next
  [Moves.HyperBeam]: 0.5,
  [Moves.BlastBurn]: 0.5,
  [Moves.HydroCannon]: 0.5,
  [Moves.FrenzyPlant]: 0.5,

  // Worth its power only where nothing touched the user first
  [Moves.FocusPunch]: 0.5,
  // And only against something already asleep
  [Moves.DreamEater]: 0.5,
  // Paid for later rather than now
  [Moves.FutureSight]: 0.7,
  [Moves.DoomDesire]: 0.7,
};

/**
 * The moves that hurt their user, whether by recoil or by the
 * confusion at the end of a rampage. They are priced against the
 * pokemon rather than flatly: the same recoil that a Snorlax shrugs
 * off is most of a Gengar and the whole of a Shedinja
 */
const SELF_HURTING = new Set<Moves>([
  Moves.DoubleEdge,
  Moves.TakeDown,
  Moves.Submission,
  Moves.VoltTackle,
  Moves.Thrash,
  Moves.PetalDance,
  Moves.Outrage,
]);

/** What one of those costs at its cheapest, and the HP that buys it */
const SELF_HURT_FACTOR = 0.7;
const SELF_HURT_HEALTH = 70;

function selfHurtFactor(species: Species, move: Moves): number {
  if (!SELF_HURTING.has(move)) {
    return 1;
  }
  const health = getSpeciesData(species).stats[Stats.HP];

  return SELF_HURT_FACTOR * Math.min(1, health / SELF_HURT_HEALTH);
}

/**
 * Which stat the species really attacks with, and how much of a
 * discount the other one takes. A move cast off the weaker of the two
 * is worth the share it can actually reach for
 */
function categoryShare(species: Species, category: MoveCategories, abilities: Abilities[]): number {
  const stats = getSpeciesData(species).stats;
  const held = new Set(abilities);
  // The abilities that double the attack stat make a special attacker
  // physical, which is exactly what they are for
  const doubled = held.has(Abilities.HugePower) || held.has(Abilities.PurePower) ? 2 : 1;
  const physical = stats[Stats.Attack] * doubled;
  const special = stats[Stats.SpecialAttack];
  const best = Math.max(1, physical, special);

  // Squared, so the weaker of the two falls away rather than merely
  // trailing: a pokemon that can hit from its good side almost always
  // has something there worth casting
  if (category === MoveCategories.Physical) {
    return (physical / best) ** 2;
  }
  if (category === MoveCategories.Special) {
    return (special / best) ** 2;
  }
  return 0;
}

/**
 * What the ability does to this move in particular. Only the ones the
 * registry can actually answer for: a Punch, a recoil and a secondary
 * effect are none of them in a move's data, so Iron Fist, Reckless
 * and Sheer Force weigh nothing here rather than being guessed at
 */
function abilityFactor(move: Moves, abilities: Abilities[], types: Types[]): number {
  const data = getMoveData(move);
  const held = new Set(abilities);
  let factor = 1;

  if (held.has(Abilities.Technician) && (data.power ?? 0) <= 60) {
    factor *= 1.5;
  }
  if (held.has(Abilities.StrongJaw) && data.flags & MoveFlags.Bite) {
    factor *= 1.5;
  }
  if (held.has(Abilities.Sharpness) && data.flags & MoveFlags.Slicing) {
    factor *= 1.5;
  }
  if (held.has(Abilities.Hustle) && data.category === MoveCategories.Physical) {
    // It buys power with accuracy, so a move that already misses is
    // the wrong place to spend it
    factor *= 1.5 * 0.8;
  }
  if (held.has(Abilities.Guts) && data.category === MoveCategories.Physical) {
    // Only while something is wrong with it, which is not most of the
    // time: worth a lean rather than a multiplier
    factor *= 1.1;
  }
  // The pinches, which only pay while the fight is going badly
  if (
    (held.has(Abilities.Overgrow) && data.type === Types.Grass) ||
    (held.has(Abilities.Blaze) && data.type === Types.Fire) ||
    (held.has(Abilities.Torrent) && data.type === Types.Water) ||
    (held.has(Abilities.Swarm) && data.type === Types.Bug)
  ) {
    factor *= 1.1;
  }
  // And the skies they bring with them, which hold for the whole
  // fight: one of the two types is worth more under it and the other
  // is worth half
  const raised = held.has(Abilities.Drought) ? Types.Fire : Types.Water;
  const damped = held.has(Abilities.Drought) ? Types.Water : Types.Fire;

  if (held.has(Abilities.Drought) || held.has(Abilities.Drizzle)) {
    if (data.type === raised) {
      factor *= 1.5;
    } else if (data.type === damped) {
      factor *= 0.5;
    }
  }
  if (held.has(Abilities.SandStream) && data.type === Types.Rock) {
    factor *= 1.2;
  }
  // Its own types hit harder for holding them, and one ability makes
  // that worth more than it is for anybody else
  if (types.includes(data.type)) {
    factor *= held.has(Abilities.Adaptability) ? 2 : 1.5;
  }
  return factor;
}

/** What one move is worth to this species, as effective power */
function moveWorth(species: Species, move: Moves, abilities: Abilities[]): number {
  const data = getMoveData(move);

  if (data.category === MoveCategories.Status) {
    const worth = STATUS_WORTH[move] ?? 0;
    const serves = SETUP_CATEGORY[move];

    // A boost is worth what the stat it raises is worth in these hands
    return serves == null ? worth : worth * categoryShare(species, serves, abilities);
  }

  const share = categoryShare(species, data.category, abilities);
  const accuracy = Math.min(NEUTRAL_ACCURACY, data.accuracy ?? NEUTRAL_ACCURACY) / NEUTRAL_ACCURACY;
  const types = getSpeciesData(species).types;
  // A move that winds up first lands once for every cast it spends
  // getting there, so its power is spread across them
  const winding = 1 + (data.steps ?? 0);

  return (
    (((data.power ?? 0) *
      share *
      accuracy *
      coverageWeight(data.type) *
      abilityFactor(move, abilities, types)) /
      winding) *
    (MOVE_DRAWBACKS[move] ?? 1) *
    selfHurtFactor(species, move)
  );
}

/**
 * Where the scoring reads a species wrong. Empty until one turns up:
 * a set written here is taken whole, so it also has to be legal,
 * which a test checks against what the species can learn
 */
export const BEST_MOVE_OVERRIDES: Partial<Record<Species, Moves[]>> = {};

/**
 * The four this species is best built with, worth first.
 *
 * Coverage before repetition: the strongest of each type is taken
 * before a second of one already carried, since four ways to hit the
 * same thing is one way to hit it. At most one move that deals no
 * damage, for the same reason
 */
export function getBestMoves(species: Species, abilities: Abilities[] = []): Moves[] {
  const written = BEST_MOVE_OVERRIDES[species];

  if (written != null) {
    return [...written];
  }

  const scored = getLearnableMoves(species)
    .map((move) => ({ move, worth: moveWorth(species, move, abilities) }))
    .sort((one, two) => two.worth - one.worth || one.move - two.move);

  const chosen: Moves[] = [];
  const covered = new Set<Types>();
  const skipped: Moves[] = [];
  let quiet = 0;

  for (const { move } of scored) {
    if (chosen.length >= BEST_MOVE_COUNT) {
      break;
    }

    const data = getMoveData(move);

    if (data.category === MoveCategories.Status) {
      if (quiet > 0) {
        continue;
      }
      quiet += 1;
      chosen.push(move);
      continue;
    }
    if (covered.has(data.type)) {
      skipped.push(move);
      continue;
    }
    covered.add(data.type);
    chosen.push(move);
  }

  // Whatever is left over fills the slots coverage could not: a
  // species with two types worth carrying still fights with four
  for (const move of skipped) {
    if (chosen.length >= BEST_MOVE_COUNT) {
      break;
    }
    chosen.push(move);
  }
  return chosen;
}
