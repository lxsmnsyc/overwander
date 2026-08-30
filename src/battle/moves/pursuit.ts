import { EventPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, MoveTargetType } from '../events';
import type Unit from '../unit';

/**
 * What Pursuit is worth against somebody walking away
 */
const CHASE_FACTOR = 2;

/**
 * Whether this unit is casting Pursuit at that one
 */
function chasing(unit: Unit, leaving: Unit): boolean {
  const casting = unit.casting;

  return (
    casting?.move === Moves.Pursuit &&
    casting.target.type === MoveTargetType.Unit &&
    casting.target.unit === leaving
  );
}

/**
 * Pursuit catches a target on its way out. A swap is declared before
 * the walk begins, so the chase is finished off there: the cast is
 * cut short the moment the target turns to go, and the hit lands
 * while it is still walking
 * https://bulbapedia.bulbagarden.net/wiki/Pursuit_(move)
 */
export default function setupPursuit(battle: Battle): void {
  battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
    if (
      event.move !== Moves.Pursuit ||
      event.power == null ||
      event.target.type !== MoveTargetType.Unit
    ) {
      return;
    }

    if (event.target.unit.status[Statuses.Switching] != null) {
      event.power *= CHASE_FACTOR;
    }
  });

  /**
   * Pre, because the casting mechanics hand a cast aimed at somebody
   * leaving over to whoever replaces them: the chase has to be spent
   * before the target is swapped out from under it
   */
  battle.on(BattleEvents.UnitSwitch, EventPriority.Pre, (event) => {
    if (event.source === event.target) {
      return;
    }

    for (const unit of battle.units()) {
      if (chasing(unit, event.source)) {
        unit.finishCast();
      }
    }
  });

  // A chase begun against somebody already walking is spent at once
  battle.on(BattleEvents.UnitCast, EventPriority.Post, (event) => {
    if (
      event.move === Moves.Pursuit &&
      event.target.type === MoveTargetType.Unit &&
      event.target.unit.status[Statuses.Switching] != null
    ) {
      event.source.finishCast();
    }
  });
}
