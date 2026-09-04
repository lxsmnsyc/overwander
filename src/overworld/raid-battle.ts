import type { CatchSnapshot } from '../auth/catch-snapshot';
import type BattleAftermath from '../auth/battle-aftermath';
import { getMaxHealth, rescaleHealth } from '../auth/health';
import type { TeamSnapshotRecord } from '../auth/teams';
import Alliance from '../battle/alliance';
import type Battle from '../battle/core';
import { BattleModes } from '../battle/core';
import { EffectType } from '../battle/events';
import type Biome from '../data/ids/biome';
import createBattle from '../battle/setup';
import Team from '../battle/team';
import Unit from '../battle/unit';
import { UNLIMITED_BATTLE_LIMITS } from '../data/constants/battle-limits';
import { STAT_ORDER, Stats, StatsKind, getIV } from '../data/constants/stats';
import {
  NON_VOLATILE_STATUSES,
  packStatuses,
  settleStatuses,
  unpackStatuses,
} from '../data/ids/status';
import { BOSS_ALLIANCE } from './raid';

/**
 * A raid, fielded.
 *
 * The engine only exists in a browser: a fight is played, watched and
 * settled on the client, and the server keeps the record of what it
 * came to rather than replaying it. So everything that builds units,
 * teams and a battle lives here, behind `client-only`, and what is
 * written down about a raid before anybody fights it stays in
 * [`raid.ts`](./raid.ts) where both sides can read it
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
  // Drawn from the shiny sheet, so a sparkling pokemon fights looking
  // like itself
  unit.shiny = snapshot.shiny;
  // What it thinks of its owner, which is what Return and Frustration
  // are worth in its hands
  unit.friendship = snapshot.friendship;
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

  return unit;
}

/**
 * Walk the built units onto the field, fastest first.
 *
 * Entering is what puts a unit in the AI's idle set and what fires
 * the abilities that read the field on arrival, so the order it
 * happens in is the order the first move is cast in. Speed decides
 * it, which is the answer a mainline turn would give.
 *
 * A raid orders each party on its own: the parties arrive side by
 * side, and whose Crobat is quickest says nothing about who should
 * act ahead of another player. Every other fight is one field, so
 * the whole of it is ordered together.
 *
 * It runs after every unit is built, not beside each one: a unit
 * announced before its health was set is not alive yet, so it is
 * never counted idle and never acts
 */
function enterBySpeed(battle: Battle, parties: Unit[][]): void {
  const fields = battle.mode === BattleModes.Raid ? parties : [parties.flat()];

  for (const field of fields) {
    // Sorted on a copy, so what a caller was handed keeps the order
    // the snapshots were stored in
    for (const unit of [...field].sort(
      (one, two) => two.checkStat(Stats.Speed, 0) - one.checkStat(Stats.Speed, 0),
    )) {
      unit.enter();
    }
  }
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
  const parties: Unit[][] = [];

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
    const party = record.catches.map((snapshot) => addUnit(battle, team, snapshot));

    parties.push(party);
    fielded.push(...party);
    units.set(record.alliance, fielded);
  }

  enterBySpeed(battle, parties);

  return { units, alliances };
}

/**
 * Assemble a raid battle from its stored team snapshots. The battle
 * id seeds the RNG, so every participant and spectator replays the
 * same rolls, and teams sharing an alliance number fight side by
 * side — the boss stands in its own
 */
export function createRaidBattle(
  battleId: string,
  teams: TeamSnapshotRecord[],
  limits = UNLIMITED_BATTLE_LIMITS,
  biome?: Biome,
): RaidBattle {
  // The boss carries Boss (and, in a shadow raid, Shadow) alongside
  // its own rolled ability, so the per-unit limit has to fit all three
  const battle = createBattle(battleId, {
    mode: BattleModes.Raid,
    realtime: true,
    limits,
    biome,
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
        coins: Math.max(0, Math.floor(unit.coins)),
        ...(unit.sketched == null ? {} : { sketched: unit.sketched }),
      });
    }
  }

  return report;
}

/**
 * How many of the player's own side ended the fight down.
 *
 * It counts the **team** rather than the records, so a party the
 * house lent counts too: nothing of the player's is on the field in a
 * rented fight, and the Frontier still has to know whether they got
 * through it whole
 */
export function countFallen(built: RaidBattle, player: string): number {
  let fallen = 0;

  for (const fielded of built.units.values()) {
    for (const unit of fielded) {
      if (unit.team.player === player && unit.health <= 0) {
        fallen += 1;
      }
    }
  }
  return fallen;
}

/**
 * How many of the other side this player's team put down.
 *
 * A lost fight still pays for what it beat, and this is the count it
 * pays on. It is the client's word, like the Pay Day coins beside it,
 * so the server clamps it to the party it actually staged
 */
export function countDefeated(built: RaidBattle, player: string): number {
  let downed = 0;

  for (const fielded of built.units.values()) {
    for (const unit of fielded) {
      if (unit.team.player !== player && unit.health <= 0) {
        downed += 1;
      }
    }
  }
  return downed;
}

/**
 * The statuses the unit carries out of the fight. A unit can hold
 * several at once — poisoned and asleep is an ordinary way to come
 * out of a raid — so all of them travel, in the order the list names
 * them. Everything volatile (confusion, a substitute, the field's own
 * effects) ends with the battle
 */
function carriedStatuses(unit: Unit): number {
  return settleStatuses(
    packStatuses(NON_VOLATILE_STATUSES.filter((status) => unit.getStatus(status) != null)),
  );
}

/**
 * Whether every unit of the alliance has fainted — how a raid is won
 * (the boss' alliance) or lost (the players')
 */
export function isAllianceDown(units: Unit[]): boolean {
  return units.length > 0 && units.every((unit) => unit.health <= 0);
}
