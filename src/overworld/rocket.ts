import AleaRNG from '../core/alea';
import type { CatchSnapshot } from '../auth/catch-snapshot';
import { getMaxHealth } from '../auth/health';
import type { TeamSnapshotRecord } from '../auth/teams';
import type Battle from '../battle/core';
import { BattleModes } from '../battle/core';
import createBattle from '../battle/setup';
import { Stats } from '../data/constants/stats';
import { PVP_BATTLE_LIMITS } from '../data/constants/battle-limits';
import { defaultSlots } from '../data/constants/slots';
import Abilities from '../data/ids/abilities';
import type ChunkSnapshot from './chunk-snapshot';
import { GIOVANNI_PARTY_SIZE, type Spawn } from './chunk-snapshot';
import deriveEncounter, { EncounterType, deriveSize } from './encounter';
import { BOSS_ALLIANCE, PLAYER_ALLIANCE, type RaidBattle, fieldTeams } from './raid';

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
 * Every pokemon a grunt fields stands at the same level, so the fight
 * is about what the player brings rather than how the window rolled
 */
export const ROCKET_PARTY_LEVEL = 50;

/**
 * The boss' six all stand here instead: Giovanni is the hardest fight
 * a walk can find, well past a grunt and shy of a raid
 */
export const GIOVANNI_PARTY_LEVEL = 75;

/**
 * The level a stop's party fights at, told apart by its size: only
 * the boss fields a full six
 */
export function rocketPartyLevel(size: number): number {
  return size >= GIOVANNI_PARTY_SIZE ? GIOVANNI_PARTY_LEVEL : ROCKET_PARTY_LEVEL;
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
 * own and asking again answers the same. Only the boss' six-strong
 * party draws from his range
 */
export function rollStopGold(seed: string, size: number): number {
  const rng = new AleaRNG(seed);
  const boss = size >= GIOVANNI_PARTY_SIZE;
  const floor = boss ? GIOVANNI_GOLD_MIN : STOP_GOLD_MIN;
  const ceiling = boss ? GIOVANNI_GOLD_MAX : STOP_GOLD_MAX;

  return floor + Math.floor(rng.random() * (ceiling - floor + 1));
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
 * is its ordinary self; either stands at ROCKET_PARTY_LEVEL whatever
 * its trait value would have rolled. Its IVs, nature, gender, ability
 * and moves are the ones the spawn tuple gives, so no two stops field
 * the same three pokemon
 */
export function createRocketSnapshot(
  snapshot: ChunkSnapshot,
  spawn: Spawn,
  shadow = true,
  level = ROCKET_PARTY_LEVEL,
): CatchSnapshot {
  const fielded = deriveEncounter(snapshot, spawn, undefined, {
    type: EncounterType.Rocket,
    level,
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
    statuses: 0,
  };
}

/**
 * The stop's whole party, weakest first: shadows for a grunt or the
 * boss, the biome's ordinary residents for a duelling trainer. The
 * party's size is what says whose it is, and fixes its level
 */
export function createRocketParty(
  snapshot: ChunkSnapshot,
  spawns: Spawn[],
  shadow = true,
): CatchSnapshot[] {
  const level = rocketPartyLevel(spawns.length);

  return spawns.map((spawn) => createRocketSnapshot(snapshot, spawn, shadow, level));
}

/**
 * Assemble a trainer fight from its stored team snapshots: no raid
 * rules, under whichever non-raid mode the fight was — a grunt's by
 * default, a player's when both sides are somebody's
 */
export function createTrainerBattle(
  battleId: string,
  teams: TeamSnapshotRecord[],
  limits = PVP_BATTLE_LIMITS,
  mode: BattleModes = BattleModes.Npc,
): RaidBattle {
  const battle: Battle = createBattle(battleId, {
    mode,
    realtime: true,
    limits,
  });

  return { battle, ...fieldTeams(battle, teams, null) };
}

/**
 * A grunt's fight: an ordinary trainer battle whose per-unit ability
 * limit only has to fit the rolled ability alongside Shadow
 */
export function createRocketBattle(
  battleId: string,
  teams: TeamSnapshotRecord[],
  limits = PVP_BATTLE_LIMITS,
): RaidBattle {
  return createTrainerBattle(battleId, teams, limits, BattleModes.Npc);
}
