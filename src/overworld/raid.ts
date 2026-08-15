import type { CatchSnapshot } from '../auth/catch-snapshot';
import { getMaxHealth, rescaleHealth } from '../auth/health';
import type BattleAftermath from '../auth/battle-aftermath';
import type { TeamSnapshotRecord } from '../auth/teams';
import {
  DEFAULT_ABILITY_SLOTS,
  DEFAULT_ITEM_SLOTS,
  DEFAULT_MOVE_SLOTS,
  packSlots,
} from '../data/constants/slots';
import Alliance from '../battle/alliance';
import type Battle from '../battle/core';
import { BattleModes } from '../battle/core';
import { BANNED_BOSS_MOVES } from '../battle/abilities/special';
import { EffectType } from '../battle/events';
import createBattle from '../battle/setup';
import Team from '../battle/team';
import Unit from '../battle/unit';
import { MAX_LEVEL } from '../data/constants/levels';
import { MAX_IV, PERFECT_IVS, STAT_ORDER, Stats, StatsKind, getIV } from '../data/constants/stats';
import Abilities from '../data/ids/abilities';
import type { Moves } from '../data/ids/moves';
import { Species } from '../data/ids/species';
import { NON_VOLATILE_STATUSES, packStatuses, unpackStatuses } from '../data/ids/status';
import { deriveAbility, deriveGender, deriveMoves, deriveNature, deriveSize } from './encounter';

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
 * What clearing one pays, on top of the pokemon. A raid is the only
 * thing in the game that hands out gold so far, and it pays each
 * fighter the same purse — the boss decides the amount, not who
 * landed the last hit. The shadow raid, being the commoner of the
 * two, pays half
 */
export const LEGENDARY_RAID_GOLD = 2000;
export const SHADOW_RAID_GOLD = 1000;

/**
 * A mythical raid pays the most of the three. The relic that opened
 * it is spent whether or not the boss went down, so what is on the
 * table has to be worth spending one on
 */
export const MYTHICAL_RAID_GOLD = 3000;

/**
 * The level a mythical arrives at. Lower than a legendary's, the way
 * the games have always handed mythicals over — the prize is the
 * pokemon itself, not what it comes ready to do
 */
export const MYTHICAL_RAID_REWARD_LEVEL = 30;

/**
 * The highest an individual value goes; a raid boss has them all
 */
export const PERFECT_IV = MAX_IV;

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
 * The four moves a boss is staged with: what its species knows at
 * `RAID_BOSS_LEVEL`, less the ones a boss may never have. The ban is
 * applied before the four are taken, so a species with more to draw
 * on still comes with a full set
 */
export function getBossMoves(species: Species): Moves[] {
  return deriveMoves(species, RAID_BOSS_LEVEL, BANNED_BOSS_MOVES);
}

/**
 * Species that are never staged as a boss, whatever the draw says.
 *
 * **Ditto** is the list. What it does is become something else, and a
 * boss is the one thing in the game that must not: the copy would
 * take a player's stats and throw away the raid-sized health pool the
 * fight is built around. Banning Transform already stops the copying,
 * but that leaves a Ditto with nothing at all to do — the answer is
 * that Ditto is not a raid boss rather than that Ditto is a quiet one
 */
export const BANNED_BOSS_SPECIES = new Set<Species>([Species.Ditto]);

/**
 * Whether the species can be a boss at all: not one of the banned
 * ones, and with something left to cast once the banned moves are
 * taken off it.
 *
 * The second half is a rule rather than a list, so a later ban cannot
 * quietly strand a species with an empty move list — it drops out of
 * the draw on its own
 */
export function canStageBoss(species: Species): boolean {
  return !BANNED_BOSS_SPECIES.has(species) && getBossMoves(species).length > 0;
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
  // The lobby shares the raid's trait value, so every player fights a
  // boss of exactly the same build
  const size = deriveSize(species, traitValue);

  return {
    caught: '',
    species,
    level: RAID_BOSS_LEVEL,
    ivs: PERFECT_IVS,
    effortValues: zeroEffortValues(),
    nature: deriveNature(traitValue),
    // The boss reads its own gender ratio, the same way a spawn
    // does; only a genderless species comes out genderless
    gender: deriveGender(species, traitValue),
    height: size.height,
    weight: size.weight,
    // A boss never sparkles, and a shadow one carries the bit its
    // ability list already says it does
    shiny: false,
    shadow,
    // A boss is staged without the moves a boss must not have: see
    // BANNED_BOSS_MOVES for what is on that list and why
    moves: getBossMoves(species),
    // A boss is staged rather than raised, so nothing has been spent
    // on what it knows
    movePoints: {},
    // The Boss ability is what makes it a raid: the health pool, the
    // stage immunities and the sweeping single-target moves all ride
    // on it, alongside the species' own rolled ability
    abilities: shadow
      ? [Abilities.Boss, Abilities.Shadow, deriveAbility(species, traitValue)]
      : [Abilities.Boss, deriveAbility(species, traitValue)],
    items: [],
    // The Boss ability and the shadow are both special, so all a boss
    // needs room for is the one it rolled
    slots: packSlots(DEFAULT_ABILITY_SLOTS, DEFAULT_ITEM_SLOTS, DEFAULT_MOVE_SLOTS),
    // A boss stands for no record either, and every lobby faces it at
    // full strength
    health: getMaxHealth({
      species,
      level: RAID_BOSS_LEVEL,
      ivs: PERFECT_IVS,
      effortValues: zeroEffortValues(),
    }),
    statuses: 0,
  };
}

/**
 * Build one battle unit from a frozen catch
 */
function addUnit(battle: Battle, team: Team, snapshot: CatchSnapshot): Unit {
  // The boss' snapshot carries no catch id, so its unit stands for no
  // record — the empty string travels through unchanged
  const unit = new Unit(battle, team, snapshot.caught);

  team.addUnit(unit);
  // Species first: it seeds the base stats and types the rest builds on
  unit.setSpecies(snapshot.species);
  unit.setLevel(snapshot.level);
  unit.setNature(snapshot.nature);
  unit.setGender(snapshot.gender);
  // The individual's own measurements, not the species' listed ones
  unit.setHeight(snapshot.height);
  unit.setWeight(snapshot.weight);
  // What it has room for, so anything asking whether a hand is free
  // asks the record rather than a rule of the battle's own
  unit.setSlots(snapshot.slots);

  for (const stat of STAT_ORDER) {
    unit.setStat(StatsKind.Individual, stat, getIV(snapshot.ivs, stat));
    unit.setStat(StatsKind.Effort, stat, snapshot.effortValues[stat]);
  }
  for (const move of snapshot.moves) {
    unit.addMove(move);
    // What its owner spent on the move, frozen with the rest of it. A
    // snapshot from before PP Ups existed carries nothing, and the
    // move fights at the PP it is registered with
    unit.setMovePoints(move, snapshot.movePoints[String(move)] ?? 0);
  }
  for (const ability of snapshot.abilities) {
    unit.addAbility(ability);
  }
  for (const item of snapshot.items) {
    unit.addItem(item);
  }
  // The unit walks in as the record left it: the share of health it
  // kept out of its last fight, and the statuses it did not shake off.
  //
  // The share, not the number. An ability can change what a unit's
  // pool is worth — a Boss carries a raid-sized one — and the record
  // it was copied from knows nothing about that, so the stored health
  // is read against the stored maximum and applied against the one
  // the unit actually fights with. A boss at full comes out at full;
  // a half-hurt pokemon that turns out to have a bigger pool here is
  // still half hurt
  unit.setHealth(
    rescaleHealth(snapshot.health, getMaxHealth(snapshot), unit.checkStat(Stats.HP, 0)),
  );

  // The cause is nothing in particular — the burn came from a battle
  // that is over. Adding them through the ordinary path is deliberate:
  // an immunity refuses one, and a held berry eats itself to cure it
  // before the first turn, both of which are the right answers
  for (const status of unpackStatuses(snapshot.statuses)) {
    unit.addStatus(status, { type: EffectType.None });
  }

  // On the field at last, and said so — **after** everything above,
  // which is the whole reason it is here rather than beside
  // `addUnit`. Entering is what puts a unit in the AI's idle set and
  // what fires the abilities that read the field on arrival, and both
  // want a finished pokemon: a unit announced before its health was
  // set is not alive yet, so it is never counted idle and never acts
  unit.enter();

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
 * Field the stored team snapshots in a battle already built: teams
 * sharing an alliance number fight side by side, and each unit
 * carries the catch record it was copied from.
 *
 * It is shared because a raid is not the only fight assembled this
 * way — a Team Rocket grunt's party is frozen and fielded exactly
 * like a player's, only under a battle of its own kind
 */
export function fieldTeams(
  battle: Battle,
  teams: TeamSnapshotRecord[],
  bossAlliance: number | null,
): Omit<RaidBattle, 'battle'> {
  const alliances = new Map<number, Alliance>();
  const units = new Map<number, Unit[]>();

  for (const record of teams) {
    let alliance = alliances.get(record.alliance);

    if (alliance == null) {
      // The boss side is marked, so a raid that ends with nobody
      // standing still resolves in the party's favor. A trainer
      // fight marks nobody: a mutual knockout is a draw there
      alliance = new Alliance(battle, record.alliance === bossAlliance);
      alliances.set(record.alliance, alliance);
    }

    // A snapshot published with an empty player — the boss, a
    // grunt's party — belongs to nobody
    const team = new Team(battle, alliance, record.player);

    alliance.addTeam(team);

    const fielded = units.get(record.alliance) ?? [];

    for (const snapshot of record.catches) {
      fielded.push(addUnit(battle, team, snapshot));
    }
    units.set(record.alliance, fielded);
  }

  return { units, alliances };
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
  });

  return { battle, ...fieldTeams(battle, teams, BOSS_ALLIANCE) };
}

/**
 * What the battle did to one player's party, catch by catch: the
 * items it spent, the health it has left and the status it is still
 * carrying.
 *
 * Every one of the player's units is reported, not only the ones that
 * lost something — a pokemon that ate nothing still walks out of the
 * fight at whatever health it has. A unit standing for no record is
 * skipped, and so is every unit belonging to somebody else: a player
 * reports their own party, never a teammate's
 */
export function collectAftermath(built: RaidBattle, player: string): BattleAftermath[] {
  const report: BattleAftermath[] = [];

  for (const fielded of built.units.values()) {
    for (const unit of fielded) {
      if (unit.caught === '' || unit.team.player !== player) {
        continue;
      }
      report.push({
        caught: unit.caught,
        items: [...unit.consumed],
        health: Math.max(0, Math.floor(unit.health)),
        statuses: carriedStatuses(unit),
      });
    }
  }

  return report;
}

/**
 * The statuses the unit carries out of the fight. A unit can hold
 * several at once — poisoned and asleep is an ordinary way to come
 * out of a raid — so all of them travel, in the order the list names
 * them. Everything volatile (confusion, a substitute, the field's own
 * effects) ends with the battle
 */
function carriedStatuses(unit: Unit): number {
  return packStatuses(NON_VOLATILE_STATUSES.filter((status) => unit.getStatus(status) != null));
}

/**
 * Whether every unit of the alliance has fainted — how a raid is won
 * (the boss' alliance) or lost (the players')
 */
export function isAllianceDown(units: Unit[]): boolean {
  return units.length > 0 && units.every((unit) => unit.health <= 0);
}
