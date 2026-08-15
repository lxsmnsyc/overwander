import { type EventListenerLifecycle, EventPriority } from '../core/event-emitter';
import { ItemFlags, type Items } from '../data/ids/items';
import { type Statuses, Weathers } from '../data/ids/status';
import { getItemData } from '../data/items';
import type Battle from './core';
import {
  BattleEvents,
  type MoveTarget,
  MoveTargetType,
  type UnitCastEvent,
  type UnitChannelEvent,
} from './events';
import type Unit from './unit';

/**
 * Whether the unit holds any item
 */
export function holdsAnyItem(unit: Unit): boolean {
  for (const held of Object.values(unit.items)) {
    if (held) {
      return true;
    }
  }
  return false;
}

/**
 * Holdable items currently occupying the unit's item slots (disabled
 * ones included); compared against the battle's item limit
 */
export function countHeldItems(unit: Unit): number {
  let count = 0;

  for (const key in unit.items) {
    // tsc requires the assertion to index the Items-mapped record;
    // tsgolint resolves the const enum to number and disagrees
    // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
    const item = Number(key) as Items;

    if (unit.items[item] != null && getItemData(item).flags & ItemFlags.Holdable) {
      count += 1;
    }
  }

  return count;
}

/**
 * A unit as a move target, for the checks that have the unit in hand
 * rather than the target that was aimed at
 */
export function unitTarget(unit: Unit): MoveTarget {
  return { type: MoveTargetType.Unit, unit };
}

/**
 * Whether the unit currently has any status from the group
 */
export function hasAnyStatus(unit: Unit, statuses: Iterable<Statuses>): boolean {
  for (const status of statuses) {
    if (unit.status[status] != null) {
      return true;
    }
  }
  return false;
}

/**
 * The real-time stand-in for a mainline turn: fires when a unit
 * reaches for a move, cast or channelled, exactly once per move.
 *
 * A clock would pay a pokemon for standing still, and the end of a
 * cast would pay nothing for an interrupted move and nothing ever for
 * a channelled one. The listeners come back as a pair so an ability
 * can drop them into its own lifecycle
 */
export function onUnitActs(
  battle: Battle,
  listener: (unit: Unit) => void,
): [EventListenerLifecycle<UnitCastEvent>, EventListenerLifecycle<UnitChannelEvent>] {
  /**
   * Who has already been paid for the move in progress. A channelled
   * move opens with a cast and channels once per remaining step, so a
   * five-hit move would otherwise pay five times over
   */
  const casting = new WeakSet<Unit>();

  return [
    battle.on(BattleEvents.UnitCast, EventPriority.Post, (event) => {
      casting.add(event.source);
      listener(event.source);
    }),
    battle.on(BattleEvents.UnitChannel, EventPriority.Post, (event) => {
      if (!casting.has(event.source)) {
        listener(event.source);
      }
    }),
  ];
}

// The skies nothing else can push aside
const PRIMAL_WEATHERS = new Set<Weathers>([
  Weathers.ExtremeSunny,
  Weathers.HeavyRain,
  Weathers.StrongWinds,
]);

export function isPrimalWeather(weather: Weathers): boolean {
  return PRIMAL_WEATHERS.has(weather);
}

export function isWeatherSunny(unit: Unit): boolean {
  const weather = unit.checkWeather();
  return weather === Weathers.Sunny || weather === Weathers.ExtremeSunny;
}

export function isWeatherRainy(unit: Unit): boolean {
  const weather = unit.checkWeather();
  return weather === Weathers.Rain || weather === Weathers.HeavyRain;
}

export function isWeatherSandstorm(unit: Unit): boolean {
  return unit.checkWeather() === Weathers.Sandstorm;
}

export function isWeatherHail(unit: Unit): boolean {
  const weather = unit.checkWeather();
  return weather === Weathers.Hail || weather === Weathers.Snow;
}
