import type { CatchSnapshot } from '../auth/catch-snapshot';
import type { TeamSnapshotRecord } from '../auth/teams';
import Alliance from '../battle/alliance';
import type Battle from '../battle/core';
import { BattleModes } from '../battle/core';
import createBattle from '../battle/setup';
import Team from '../battle/team';
import Unit from '../battle/unit';
import { MAX_LEVEL } from '../data/constants/levels';
import { Stats, StatsKind } from '../data/constants/stats';
import Abilities from '../data/ids/abilities';
import type { Species } from '../data/ids/species';
import { deriveAbility, deriveGender, deriveMoves, deriveNature } from './encounter';

/**
 * A raid boss is a maxed legendary: the fight is meant to need a
 * party, not a lucky level gap
 */
export const RAID_BOSS_LEVEL = MAX_LEVEL;

/**
 * The alliance the raid boss fights under; every player team shares
 * the other one, so the whole lobby is allied against it
 */
export const BOSS_ALLIANCE = 0;
export const PLAYER_ALLIANCE = 1;

/**
 * The reward comes at a fixed level rather than a rolled one, so
 * clearing the same raid is worth the same to everyone. A legendary
 * arrives half-grown; a shadow, being the commoner prize, arrives
 * lower still
 */
export const LEGENDARY_RAID_REWARD_LEVEL = 50;
export const SHADOW_RAID_REWARD_LEVEL = 25;

/**
 * The highest an individual value goes; a raid boss has them all
 */
export const PERFECT_IV = 31;

const ALL_STATS = [
  Stats.HP,
  Stats.Attack,
  Stats.Defense,
  Stats.SpecialAttack,
  Stats.SpecialDefense,
  Stats.Speed,
];

function perfectIVs(): Record<Stats, number> {
  return {
    [Stats.HP]: PERFECT_IV,
    [Stats.Attack]: PERFECT_IV,
    [Stats.Defense]: PERFECT_IV,
    [Stats.SpecialAttack]: PERFECT_IV,
    [Stats.SpecialDefense]: PERFECT_IV,
    [Stats.Speed]: PERFECT_IV,
  };
}

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
 * The raid boss as a catch snapshot, so a battle builds it from the
 * same shape as a player's party. Its individual values are perfect
 * and its effort values zero; the nature and ability come from the
 * raid's trait value, which every player in the lobby shares. It
 * belongs to no catch record, so its `caught` id is empty. A shadow
 * boss carries the Shadow ability on top of the Boss one
 */
export function createRaidBossSnapshot(
  species: Species,
  traitValue: number,
  shadow = false,
): CatchSnapshot {
  return {
    caught: '',
    species,
    level: RAID_BOSS_LEVEL,
    ivs: perfectIVs(),
    effortValues: zeroEffortValues(),
    nature: deriveNature(traitValue),
    // The boss reads its own gender ratio, the same way a spawn
    // does; only a genderless species comes out genderless
    gender: deriveGender(species, traitValue),
    shiny: false,
    moves: deriveMoves(species, RAID_BOSS_LEVEL),
    // The Boss ability is what makes it a raid: the health pool, the
    // stage immunities and the sweeping single-target moves all ride
    // on it, alongside the species' own rolled ability
    abilities: shadow
      ? [Abilities.Boss, Abilities.Shadow, deriveAbility(species, traitValue)]
      : [Abilities.Boss, deriveAbility(species, traitValue)],
    items: [],
  };
}

/**
 * Build one battle unit from a frozen catch
 */
function addUnit(battle: Battle, team: Team, snapshot: CatchSnapshot): Unit {
  const unit = new Unit(battle, team);

  team.addUnit(unit);
  // Species first: it seeds the base stats and types the rest builds on
  unit.setSpecies(snapshot.species);
  unit.setLevel(snapshot.level);
  unit.setNature(snapshot.nature);
  unit.setGender(snapshot.gender);

  for (const stat of ALL_STATS) {
    unit.setStat(StatsKind.Individual, stat, snapshot.ivs[stat]);
    unit.setStat(StatsKind.Effort, stat, snapshot.effortValues[stat]);
  }
  for (const move of snapshot.moves) {
    unit.addMove(move);
  }
  for (const ability of snapshot.abilities) {
    unit.addAbility(ability);
  }
  for (const item of snapshot.items) {
    unit.addItem(item);
  }
  unit.setHealth(unit.checkStat(Stats.HP, 0));

  return unit;
}

export interface RaidBattle {
  battle: Battle;
  /**
   * The units of every team, keyed by the alliance they fight under
   */
  units: Map<number, Unit[]>;
  /**
   * The alliances themselves, so a caller can tell which side the
   * settled battle named as its winner
   */
  alliances: Map<number, Alliance>;
}

/**
 * Assemble a raid battle from its stored team snapshots. The battle
 * id seeds the RNG, so every participant and spectator replays the
 * same rolls, and teams sharing an alliance number fight side by
 * side — the boss stands in its own
 */
export function createRaidBattle(battleId: string, teams: TeamSnapshotRecord[]): RaidBattle {
  // The boss carries Boss (and, in a shadow raid, Shadow) alongside
  // its own rolled ability, so the per-unit limit has to fit all three
  const battle = createBattle(battleId, {
    mode: BattleModes.Raid,
    realtime: true,
    limits: { abilities: 3 },
  });
  const alliances = new Map<number, Alliance>();
  const units = new Map<number, Unit[]>();

  for (const record of teams) {
    let alliance = alliances.get(record.alliance);

    if (alliance == null) {
      // The boss side is marked, so a raid that ends with nobody
      // standing still resolves in the party's favor
      alliance = new Alliance(battle, record.alliance === BOSS_ALLIANCE);
      alliances.set(record.alliance, alliance);
    }

    const team = new Team(battle, alliance);

    alliance.addTeam(team);

    const fielded = units.get(record.alliance) ?? [];

    for (const snapshot of record.catches) {
      fielded.push(addUnit(battle, team, snapshot));
    }
    units.set(record.alliance, fielded);
  }

  return { battle, units, alliances };
}

/**
 * Whether every unit of the alliance has fainted — how a raid is won
 * (the boss' alliance) or lost (the players')
 */
export function isAllianceDown(units: Unit[]): boolean {
  return units.length > 0 && units.every((unit) => unit.health <= 0);
}
