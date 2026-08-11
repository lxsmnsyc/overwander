import type { CatchSnapshot } from '../auth/catch-snapshot';
import { getMaxHealth } from '../auth/health';
import type { TeamSnapshotRecord } from '../auth/teams';
import type Battle from '../battle/core';
import { BattleModes } from '../battle/core';
import createBattle from '../battle/setup';
import { Stats } from '../data/constants/stats';
import Abilities from '../data/ids/abilities';
import type ChunkSnapshot from './chunk-snapshot';
import type { Spawn } from './chunk-snapshot';
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
 * What beating one pays. A grunt is a commoner's purse next to a
 * raid boss, and unlike a raid it can be found again next window
 */
export const ROCKET_STOP_GOLD = 500;

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
 * One of the grunt's pokemon as a catch snapshot, so its party is
 * fielded from the same shape a player's is. Every one of them is a
 * shadow — that is what a Team Rocket pokemon is — and every one
 * stands at ROCKET_PARTY_LEVEL whatever its trait value would have
 * rolled. Its IVs, nature, gender, ability and moves are the ones the
 * spawn tuple gives, so no two grunts field the same three pokemon
 */
export function createRocketSnapshot(snapshot: ChunkSnapshot, spawn: Spawn): CatchSnapshot {
  const grunt = deriveEncounter(snapshot, spawn, undefined, {
    type: EncounterType.Rocket,
    level: ROCKET_PARTY_LEVEL,
    shadow: true,
  });
  const size = deriveSize(grunt.species, grunt.traitValue);

  return {
    // A grunt's pokemon stands for no catch record
    caught: '',
    species: grunt.species,
    level: grunt.level,
    ivs: grunt.ivs,
    effortValues: zeroEffortValues(),
    nature: grunt.nature,
    gender: grunt.gender,
    height: size.height,
    weight: size.weight,
    // A grunt's pokemon never sparkles: the prize is what it drops,
    // not what it fields
    shiny: false,
    moves: grunt.moves,
    abilities: [grunt.ability, Abilities.Shadow],
    items: [],
    // A grunt's pokemon has no record to have been hurt on: it is
    // made for this fight and arrives whole
    health: getMaxHealth({
      species: grunt.species,
      level: grunt.level,
      ivs: grunt.ivs,
      effortValues: zeroEffortValues(),
    }),
    statuses: [],
  };
}

/**
 * The grunt's whole party, weakest first
 */
export function createRocketParty(snapshot: ChunkSnapshot, spawns: Spawn[]): CatchSnapshot[] {
  return spawns.map((spawn) => createRocketSnapshot(snapshot, spawn));
}

/**
 * Assemble the fight from its stored team snapshots. It is an
 * ordinary trainer battle: no raid rules, and the per-unit ability
 * limit only has to fit the rolled ability alongside Shadow
 */
export function createRocketBattle(battleId: string, teams: TeamSnapshotRecord[]): RaidBattle {
  const battle: Battle = createBattle(battleId, {
    mode: BattleModes.PvP,
    realtime: true,
    limits: { abilities: 2 },
  });

  return { battle, ...fieldTeams(battle, teams, null) };
}
