import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { MoveCategories, Moves } from '../../data/ids/moves';
import { getMoveData } from '../../data/moves';
import { FIXED_G_MAX_MOVES, getGMaxMove } from '../../data/moves/gmax-moves';
import {
  MAX_MOVE_ALLY_STAGES,
  MAX_MOVE_FOE_STAGES,
  MAX_MOVE_TERRAINS,
  MAX_MOVE_WEATHERS,
  TYPE_MAX_MOVES,
  maxPowerOf,
} from '../../data/moves/max-moves';
import { isPseudoMove } from '../../data/moves/pseudo';
import type Battle from '../core';
import { BattleEvents, EffectType, type MoveTarget, MoveTargetType } from '../events';
import { isPrimalWeather } from '../utils';
import type Unit from '../unit';
import { TERRAIN_DURATION } from './terrain';
import { WEATHER_DURATION } from './weather';
import { zTargetOf } from './z-moves';

/**
 * Max Moves. Every move a Dynamaxed unit casts goes off as the Max
 * Move of its type, or as Max Guard for a status move, and a
 * Gigantamax throws its G-Max Move where its species has one. Only
 * its own casts are turned: a move an ability throws for it goes off
 * as itself. https://bulbapedia.bulbagarden.net/wiki/Max_Move
 */

/** The Max Move, or G-Max Move, a damaging move of this type becomes for this unit */
export function maxMoveFor(unit: Unit, base: Moves, target: MoveTarget): Moves | null {
  if (getMoveData(base).category === MoveCategories.Status) {
    return Moves.MaxGuard;
  }
  const type = unit.checkMoveType(base, target);
  const gmax = unit.gigantamax ? getGMaxMove(unit.species, type) : null;

  return gmax ?? TYPE_MAX_MOVES.get(type) ?? null;
}

export default function setupMaxMoves(battle: Battle): void {
  /** Units whose own cast is going off right now */
  const acting = new WeakSet<Unit>();
  /** The move each unit's Max Move replaced, for its power and category */
  const replaced = new Map<Unit, { base: Moves; max: Moves }>();

  battle.on(BattleEvents.UnitFinishCast, EventPriority.Pre, (event) => {
    if (event.source.dynamaxed) {
      acting.add(event.source);
    }
  });
  battle.on(BattleEvents.UnitFinishCast, EventPriority.Post, (event) => {
    acting.delete(event.source);
  });

  battle.on(BattleEvents.UnitTriggerMove, AttackPriority.Pre, (event) => {
    const unit = event.source;

    if (!acting.has(unit) || !unit.dynamaxed || isPseudoMove(event.move)) {
      return;
    }
    // One conversion a cast: the Max Move itself goes off as it is
    acting.delete(unit);

    const max = maxMoveFor(unit, event.move, event.target);

    if (max == null) {
      return;
    }
    const aimed =
      max === Moves.MaxGuard
        ? ({ type: MoveTargetType.None } as const)
        : zTargetOf(battle, unit, event.target);

    if (aimed == null) {
      return;
    }
    event.disabled = true;
    replaced.set(unit, { base: event.move, max });
    unit.triggerMove(max, aimed, 0);
  });

  battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Exact, (event) => {
    const turned = replaced.get(event.source);

    // The three fixed G-Max Moves keep their own 160
    if (turned?.max === event.move && !FIXED_G_MAX_MOVES.has(event.move)) {
      event.power = maxPowerOf(turned.base);
    }
  });

  battle.on(BattleEvents.UnitAttack, AttackPriority.Pre, (event) => {
    const turned = replaced.get(event.source);

    if (turned?.max === event.move) {
      event.category = getMoveData(turned.base).category;
    }
  });

  // What each Max Move leaves behind once it has landed
  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Post, (event) => {
    const unit = event.source;
    const cause = { type: EffectType.Move, move: event.move, unit } as const;
    const weather = MAX_MOVE_WEATHERS.get(event.move);
    const terrain = MAX_MOVE_TERRAINS.get(event.move);
    const drop = MAX_MOVE_FOE_STAGES.get(event.move);
    const raise = MAX_MOVE_ALLY_STAGES.get(event.move);

    // Explicit null checks: the first member of each enum is 0
    if (weather != null && !isPrimalWeather(unit.checkWeather())) {
      unit.setWeather(weather, unit.checkWeatherDuration(weather, WEATHER_DURATION));
    }
    if (terrain != null) {
      unit.setTerrain(terrain, unit.checkTerrainDuration(terrain, TERRAIN_DURATION));
    }
    if (drop != null) {
      for (const foe of battle.units(unit.team.alliance)) {
        if (foe.alive) {
          foe.addStage(drop, -1, cause);
        }
      }
    }
    if (raise != null) {
      for (const team of unit.team.alliance.teams) {
        for (const ally of team.units) {
          if (ally.alive) {
            ally.addStage(raise, 1, cause);
          }
        }
      }
    }
  });

  for (const gone of [BattleEvents.UnitFaints, BattleEvents.UnitLeavesField] as const) {
    battle.on(gone, EventPriority.Post, (event) => {
      replaced.delete(event.source);
    });
  }
}
