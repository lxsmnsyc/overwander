import type { TeamSnapshotRecord } from '../../../src/auth/teams';
import { chooseMove } from '../../../src/battle/ai/choose-move';
import type Battle from '../../../src/battle/battle';
import { BattleModes } from '../../../src/battle/battle';
import { BattleEvents } from '../../../src/battle/events';
import { isConsumable } from '../../../src/battle/items/held';
import type Unit from '../../../src/battle/unit';
import { AttackPriority, EventPriority } from '../../../src/core/event-emitter';
import { Stats } from '../../../src/data/constants/stats';
import Abilities from '../../../src/data/ids/abilities';
import { DamageFlags, type Moves } from '../../../src/data/ids/moves';
import type { Items } from '../../../src/data/ids/items';
import { Stages } from '../../../src/data/ids/stats';
import { BOSS_DAMAGE_CAP, BOSS_INDIRECT_RATE } from '../../../src/battle/abilities/special';
import { BOSS_ALLIANCE } from '../../../src/overworld/raid';
import { type BattleInput, type RaidInput, buildRaidTeams } from '../arbitraries';
import { type Cast, type SimResult, rollTeams, runBattle } from '../../sim/ai-sim';

/** The rules a watched battle is checked against, one property each */
export const enum Rule {
  Bounds = 'bounds',
  Settles = 'settles',
  Purity = 'purity',
  Items = 'items',
  BossCap = 'boss-cap',
}

export interface WatchReport {
  result: SimResult;
  /** What broke each rule, empty where it held */
  broken: Record<Rule, string[]>;
}

/** How often the AI is asked for a move outside its own turn, in ticks */
const PROBE_EVERY = 30;

/** More than this many breaches of one rule says nothing new */
const MAX_BREACHES = 5;

const ALL_STATS = [
  Stats.HP,
  Stats.Attack,
  Stats.Defense,
  Stats.SpecialAttack,
  Stats.SpecialDefense,
  Stats.Speed,
];

const ALL_STAGES = [
  Stages.Attack,
  Stages.Defense,
  Stages.SpecialAttack,
  Stages.SpecialDefense,
  Stages.Speed,
  Stages.Evasion,
  Stages.Accuracy,
];

function describeUnit(unit: Unit): string {
  return `${unit.team.player || 'boss'}:${unit.species}`;
}

function readHeldItems(unit: Unit): Set<Items> {
  const held = new Set<Items>();

  // A removed item stays as an undefined key, which the record's type does not say
  for (const key of Object.keys(unit.items)) {
    const item: Items = Number(key);

    if (unit.items[item] != null) {
      held.add(item);
    }
  }
  return held;
}

function readKeys(record: object): string[] {
  const keys: string[] = [];

  for (const [key, value] of Object.entries(record)) {
    if (value != null && value !== false) {
      keys.push(key);
    }
  }
  return keys.sort();
}

/**
 * What a guess must leave alone, as plain values read off public
 * state: health, stages, statuses, held items, abilities, move
 * states, the tallies the fight reports, and the field
 */
export function snapshotBattle(battle: Battle): unknown {
  const units: unknown[] = [];

  for (const unit of battle.units()) {
    const moves: unknown[] = [];

    for (const key of Object.keys(unit.moves)) {
      const state = unit.moves[Number(key) as Moves];

      if (state != null) {
        moves.push([state.move, state.disabled, state.points, state.cooldown?.progress ?? null]);
      }
    }
    units.push({
      unit: describeUnit(unit),
      health: unit.health,
      alive: unit.alive,
      stages: { ...unit.stages },
      status: readKeys(unit.status),
      items: { ...unit.items },
      consumed: [...unit.consumed].sort((a, b) => a - b),
      abilities: { ...unit.abilities },
      worn: readKeys(unit.worn),
      types: [...unit.types].sort((a, b) => a - b),
      moves,
      tallies: [unit.dealt, unit.taken, unit.criticals, unit.coins, unit.recoil],
      casting: unit.casting?.move ?? null,
      channeling: unit.channeling?.move ?? null,
    });
  }

  const teams: unknown[] = [];

  for (const team of battle.teams()) {
    teams.push(readKeys(team.status));
  }
  return {
    units,
    teams,
    weather: battle.weather.current,
    terrain: battle.terrain.current,
  };
}

/** Play one fight with every rule watched */
export function watchBattle(
  input: BattleInput,
  teams: TeamSnapshotRecord[],
  mode = BattleModes.PvP,
): WatchReport {
  const broken: Record<Rule, string[]> = {
    [Rule.Bounds]: [],
    [Rule.Settles]: [],
    [Rule.Purity]: [],
    [Rule.Items]: [],
    [Rule.BossCap]: [],
  };
  const held = new Map<Unit, Set<Items>>();
  const everHeld = new Map<Unit, Set<Items>>();
  const wear = new Map<Unit, number>();
  let ticks = 0;

  function breach(rule: Rule, message: string): void {
    if (broken[rule].length < MAX_BREACHES) {
      broken[rule].push(message);
    }
  }

  function start(battle: Battle): void {
    // The items each unit walked on with
    for (const unit of battle.units()) {
      const items = readHeldItems(unit);

      held.set(unit, items);
      everHeld.set(unit, new Set(items));
    }

    // An item comes and goes only through the add and remove events,
    // and a foe takes it for good only when it is a consumable
    battle.on(BattleEvents.UnitAddItem, EventPriority.Post, (event) => {
      held.get(event.source)?.add(event.item);
      everHeld.get(event.source)?.add(event.item);
    });
    battle.on(BattleEvents.UnitRemoveItem, EventPriority.Post, (event) => {
      held.get(event.source)?.delete(event.item);
      if (
        event.lost &&
        'unit' in event.cause &&
        event.cause.unit !== event.source &&
        !isConsumable(event.item)
      ) {
        breach(
          Rule.Items,
          `${describeUnit(event.source)} lost item ${event.item} for good to ${describeUnit(event.cause.unit)}`,
        );
      }
    });

    // A boss takes indirect and share-of-HP damage only out of its
    // allowance, which holds the cap and refills at the boss rate
    battle.on(BattleEvents.UnitDamage, AttackPriority.Cleanup, (event) => {
      if (
        !event.success ||
        event.value <= 0 ||
        event.flags & DamageFlags.Cost ||
        !(event.flags & (DamageFlags.Indirect | DamageFlags.HealthScaled)) ||
        !event.target.hasAbility(Abilities.Boss)
      ) {
        return;
      }
      const worn = (wear.get(event.target) ?? 0) + event.value;

      wear.set(event.target, worn);
      if (worn > BOSS_DAMAGE_CAP + BOSS_INDIRECT_RATE / 60 + 1e-6) {
        breach(
          Rule.BossCap,
          `${describeUnit(event.target)} took ${Math.round(worn)} indirect damage within the allowance of ${BOSS_DAMAGE_CAP}`,
        );
      }
    });
  }

  function checkBounds(battle: Battle, time: number): void {
    for (const unit of battle.units()) {
      const max = unit.checkStat(Stats.HP, 0);

      if (!Number.isFinite(unit.health) || unit.health < 0 || unit.health > max) {
        breach(Rule.Bounds, `${describeUnit(unit)} at ${unit.health} of ${max} HP, ${time} ms`);
      }
      for (const stat of ALL_STATS) {
        if (!Number.isFinite(unit.checkStat(stat, 0))) {
          breach(Rule.Bounds, `${describeUnit(unit)} stat ${stat} is not a number, ${time} ms`);
        }
      }
      for (const stage of ALL_STAGES) {
        if (!Number.isFinite(unit.stages[stage])) {
          breach(Rule.Bounds, `${describeUnit(unit)} stage ${stage} is not a number, ${time} ms`);
        }
      }
    }
  }

  function checkItems(battle: Battle, time: number): void {
    for (const unit of battle.units()) {
      const actual = readHeldItems(unit);
      const expected = held.get(unit) ?? new Set<Items>();

      let same = actual.size === expected.size;

      for (const item of actual) {
        if (!expected.has(item)) {
          same = false;
        }
      }
      if (!same) {
        breach(
          Rule.Items,
          `${describeUnit(unit)} holds [${[...actual].join(', ')}], events say [${[...expected].join(', ')}], ${time} ms`,
        );
      }
    }
  }

  function probe(battle: Battle, time: number): void {
    for (const unit of battle.units()) {
      if (!unit.alive) {
        continue;
      }
      const before = JSON.stringify(snapshotBattle(battle));

      chooseMove(battle, unit);

      const after = JSON.stringify(snapshotBattle(battle));

      if (before !== after) {
        breach(
          Rule.Purity,
          `weighing a move for ${describeUnit(unit)} at ${time} ms changed the fight`,
        );
      }
    }
  }

  function tick(battle: Battle, time: number): void {
    ticks++;

    // The allowance refills with fight time
    for (const [unit, worn] of wear) {
      wear.set(unit, Math.max(0, worn - BOSS_INDIRECT_RATE / 60));
    }

    checkBounds(battle, time);
    checkItems(battle, time);
    if (ticks % PROBE_EVERY === 0) {
      probe(battle, time);
    }
  }

  const result = runBattle(input.seed, teams, Infinity, {
    mode,
    bossAlliance: mode === BattleModes.Raid ? BOSS_ALLIANCE : null,
    onStart: start,
    onTick: tick,
  });

  // A fight between players ends on its own, with a winner or a draw
  if (mode === BattleModes.PvP && result.timedOut) {
    broken[Rule.Settles].push(`still going after ${Math.round(result.duration)} ms`);
  }

  // Nothing is lost for good that the unit never held
  for (const [unit, items] of everHeld) {
    for (const item of unit.consumed) {
      if (!items.has(item)) {
        breach(Rule.Items, `${describeUnit(unit)} reports item ${item} lost, which it never held`);
      }
    }
  }
  return { result, broken };
}

const battles = new Map<string, WatchReport>();
const raids = new Map<string, WatchReport>();

/** A watched fight, played once however many properties read it */
export function watchFight(input: BattleInput): WatchReport {
  const key = JSON.stringify(input);
  let report = battles.get(key);

  if (report == null) {
    report = watchBattle(input, rollTeams(input.seed, input));
    battles.set(key, report);
  }
  return report;
}

export function watchRaid(input: RaidInput): WatchReport {
  const key = JSON.stringify(input);
  let report = raids.get(key);

  if (report == null) {
    report = watchBattle(input, buildRaidTeams(input), BattleModes.Raid);
    raids.set(key, report);
  }
  return report;
}

/** The casts of a fight played plainly, nothing watching it */
export function playCasts(input: BattleInput): Cast[] {
  return runBattle(input.seed, rollTeams(input.seed, input)).casts;
}
