import { SHADOW_FRIENDSHIP } from '../data/constants/friendship';
import AleaRNG from '../core/alea';
import type { CatchSnapshot } from '../auth/catch-snapshot';
import { getMaxHealth } from '../auth/health';
import { Stats } from '../data/constants/stats';
import { defaultSlots } from '../data/constants/slots';
import Abilities from '../data/ids/abilities';
import Landmark from '../data/overworld/landmark';
import type ChunkSnapshot from './chunk-snapshot';
import { GIOVANNI_PARTY_SIZE, type Spawn } from './chunk-snapshot';
import deriveEncounter, { EncounterType, deriveSize } from './encounter';
import { BOSS_ALLIANCE, PLAYER_ALLIANCE } from './raid';

/**
 * The Team Rocket stop: a grunt who bars a cell for the window and
 * fights whoever accepts.
 *
 * It is a trainer battle rather than a raid — three pokemon a side,
 * nobody flagged as a boss, and the party is the player's own — but
 * everything under it is the same machinery: the grunt's team is
 * frozen into snapshots exactly as a player's is, and the fight runs
 * from the battle id like any other.
 */

/**
 * A level band rather than one level: every pokemon rolls its own
 * inside it off its trait value, so a party has a spread and the
 * fight is still about what the player brought
 */
export type LevelBand = [minimum: number, maximum: number];

export const ROCKET_PARTY_LEVELS: LevelBand = [45, 55];

/**
 * The boss' six stand well above his grunts: Giovanni is the hardest
 * fight a walk can find that is not a league seat
 */
export const GIOVANNI_PARTY_LEVELS: LevelBand = [70, 80];

/**
 * The band a stop's party fights in, told apart by its size: only the
 * boss fields a full six
 */
export function rocketPartyLevels(size: number): LevelBand {
  return size >= GIOVANNI_PARTY_SIZE ? GIOVANNI_PARTY_LEVELS : ROCKET_PARTY_LEVELS;
}

/**
 * The ladder the league fights on: a gym leader takes on challengers
 * who have beaten the road, the Elite Four stand above them, and the
 * Champion above all of it
 */
export const GYM_PARTY_LEVELS: LevelBand = [45, 65];
export const ELITE_PARTY_LEVELS: LevelBand = [65, 85];
export const CHAMPION_PARTY_LEVELS: LevelBand = [85, 100];

/**
 * The band any stop's party fights in, keyed by the landmark it
 * stands on. The league all field 6, so size alone cannot tell a gym
 * from the Champion; a duelling trainer's band is their class', which
 * the caller passes in
 */
export function stopPartyLevels(landmark: Landmark, size: number, trainer?: LevelBand): LevelBand {
  if (landmark === Landmark.GymLeader) {
    return GYM_PARTY_LEVELS;
  }
  if (landmark === Landmark.EliteFour) {
    return ELITE_PARTY_LEVELS;
  }
  if (landmark === Landmark.Champion) {
    return CHAMPION_PARTY_LEVELS;
  }
  if (landmark === Landmark.Trainer && trainer != null) {
    return trainer;
  }
  return rocketPartyLevels(size);
}

/**
 * What beating a grunt or a duelling trainer pays: a purse rolled in
 * this range rather than a flat fee, so a stop is worth walking to
 * and no two wins feel quite alike
 */
export const STOP_GOLD_MIN = 1000;
export const STOP_GOLD_MAX = 10000;

/**
 * And the boss' purse: one win in sixty-four windows should fund
 * something, not buy a round of potions
 */
export const GIOVANNI_GOLD_MIN = 10000;
export const GIOVANNI_GOLD_MAX = 50000;

/**
 * The purse a beaten stop pays, seeded so each winner's roll is their
 * own and asking again answers the same. `boss` draws from the top
 * range: Giovanni's, and the Champion's — the two rarest wins a walk
 * can land
 */
export function rollStopGold(seed: string, boss: boolean): number {
  const rng = new AleaRNG(seed);
  const floor = boss ? GIOVANNI_GOLD_MIN : STOP_GOLD_MIN;
  const ceiling = boss ? GIOVANNI_GOLD_MAX : STOP_GOLD_MAX;

  return floor + Math.floor(rng.random() * (ceiling - floor + 1));
}

/**
 * Whether a stop's purse is a boss purse: Giovanni's full six on a
 * Team Rocket cell, or the Champion's on their own
 */
export function isBossPurse(landmark: Landmark, size: number): boolean {
  return (
    landmark === Landmark.Champion ||
    (landmark === Landmark.TeamRocket && size >= GIOVANNI_PARTY_SIZE)
  );
}

/**
 * The level the pokemon a beaten grunt drops comes at. It is fixed,
 * so the prize is the same for everyone who put the same grunt down —
 * and low, because what is being handed over is a commoner taken off
 * a thief, not a raid boss' legendary
 */
export const ROCKET_REWARD_LEVEL = 10;

/**
 * The alliance the grunt's party fights under — the side opposite the
 * player, the same number a raid boss takes. Nothing marks it as a
 * boss, so a fight that ends with nobody standing is a draw rather
 * than a win
 */
export const ROCKET_ALLIANCE = BOSS_ALLIANCE;

export { PLAYER_ALLIANCE };

function zeroEffortValues(): Record<Stats, number> {
  return {
    [Stats.HP]: 0,
    [Stats.Attack]: 0,
    [Stats.Defense]: 0,
    [Stats.SpecialAttack]: 0,
    [Stats.SpecialDefense]: 0,
    [Stats.Speed]: 0,
  };
}

/**
 * One of the stop's pokemon as a catch snapshot, so the party is
 * fielded from the same shape a player's is. A grunt's is a shadow —
 * that is what a Team Rocket pokemon is — where a duelling trainer's
 * is its ordinary self; either rolls its level inside the band it was
 * staged with rather than the one its species would have taken. Its
 * IVs, nature, gender, ability and moves are the ones the spawn tuple
 * gives, so no two stops field the same three pokemon
 */
export function createRocketSnapshot(
  snapshot: ChunkSnapshot,
  spawn: Spawn,
  shadow = true,
  levels: LevelBand = ROCKET_PARTY_LEVELS,
): CatchSnapshot {
  const fielded = deriveEncounter(snapshot, spawn, undefined, {
    type: EncounterType.Rocket,
    levels,
    shadow,
  });
  const size = deriveSize(fielded.species, fielded.traitValue);
  const abilities = shadow ? [fielded.ability, Abilities.Shadow] : [fielded.ability];

  return {
    // A stop's pokemon stands for no catch record
    caught: '',
    species: fielded.species,
    level: fielded.level,
    ivs: fielded.ivs,
    effortValues: zeroEffortValues(),
    nature: fielded.nature,
    gender: fielded.gender,
    height: size.height,
    weight: size.weight,
    // A stop's pokemon never sparkles: the prize is what the fight
    // pays, not what it fields
    shiny: false,
    shadow,
    moves: fielded.moves,
    // A stop buys no PP Ups: what it fields is what the roll gave it
    movePoints: {},
    abilities,
    items: [],
    slots: defaultSlots(abilities),
    // A stop's pokemon has no record to have been hurt on: it is
    // made for this fight and arrives whole
    health: getMaxHealth({
      species: fielded.species,
      level: fielded.level,
      ivs: fielded.ivs,
      effortValues: zeroEffortValues(),
    }),
    // A shadow has been made to fight and nothing else
    friendship: SHADOW_FRIENDSHIP,
    statuses: 0,
  };
}

/**
 * The stop's whole party, weakest first: shadows for a grunt or the
 * boss, ordinary pokemon for a duelling trainer or a league seat. The
 * band defaults to what the party's size says, for the callers that
 * predate the league; theirs is the landmark's to fix
 */
export function createRocketParty(
  snapshot: ChunkSnapshot,
  spawns: Spawn[],
  shadow = true,
  levels: LevelBand = rocketPartyLevels(spawns.length),
): CatchSnapshot[] {
  return spawns.map((spawn) => createRocketSnapshot(snapshot, spawn, shadow, levels));
}
