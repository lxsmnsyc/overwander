import { AttackPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import type { Statuses } from '../../data/ids/status';
import { USELESS_PENALTY } from '../ai/score';
import type Battle from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';
import { MAJOR_STATUS_CONDITIONS } from '../status';
import type Unit from '../unit';

/**
 * Psycho Shift hands the user's ailment to whoever it is aimed at,
 * which cures the user in the same breath. It moves one ailment
 * rather than every status the user is carrying: a burn is somebody
 * else's problem now, but a Leech Seed is still the user's
 * https://bulbapedia.bulbagarden.net/wiki/Psycho_Shift_(move)
 */
function carried(unit: Unit): Statuses | null {
  for (const status of MAJOR_STATUS_CONDITIONS) {
    if (unit.status[status] != null) {
      return status;
    }
  }
  return null;
}

export default function setupPsychoShift(battle: Battle): void {
  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    if (event.move !== Moves.PsychoShift || event.target.type !== MoveTargetType.Unit) {
      return;
    }

    const passed = carried(event.source);

    if (passed == null) {
      return;
    }

    const cause = { type: EffectType.Move, move: event.move, unit: event.source } as const;

    // Put on first: a target that refuses the ailment, for its type or
    // for what it is holding, leaves the user still carrying it
    event.target.unit.addStatus(passed, cause);
    if (event.target.unit.status[passed] != null) {
      event.source.removeStatus(passed, cause);
    }
  });

  // Nothing to hand over is a cast spent on nothing
  battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    if (event.move === Moves.PsychoShift && carried(event.source) == null) {
      event.score -= USELESS_PENALTY;
    }
  });
}
