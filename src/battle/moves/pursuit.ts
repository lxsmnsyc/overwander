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
 * Pursuit catches a target on its way out.
 *
 * A swap is declared before the walk begins, and everything else
 * aimed at whoever is leaving follows the swap onto whoever takes
 * their place. This one must not: the chase is struck straight at the
 * one going, in the moment the swap is announced, so it is thrown
 * here rather than left to the move pipeline that would re-aim it
 * https://bulbapedia.bulbagarden.net/wiki/Pursuit_(move)
 */
export default function setupPursuit(battle: Battle): void {
  /** Who is mid-chase, for as long as the strike takes to resolve. */
  const caught = new WeakSet<Unit>();

  battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
    if (
      event.move !== Moves.Pursuit ||
      event.power == null ||
      event.target.type !== MoveTargetType.Unit
    ) {
      return;
    }

    if (caught.has(event.source) || event.target.unit.status[Statuses.Switching] != null) {
      event.power *= CHASE_FACTOR;
    }
  });

  /**
   * Pre, because the swap has not happened yet: the target is still
   * standing where it was, and nothing has been handed over
   */
  battle.on(BattleEvents.UnitSwitch, EventPriority.Pre, (event) => {
    if (event.source === event.target) {
      return;
    }

    for (const unit of battle.units()) {
      if (!chasing(unit, event.source)) {
        continue;
      }

      const target = { type: MoveTargetType.Unit, unit: event.source } as const;

      // The cast is spent rather than finished: a finish would put the
      // move back into the air, where the swap would re-aim it
      unit.stopCast();
      unit.startCooldown(Moves.Pursuit, target);

      caught.add(unit);
      unit.triggerMoveTarget(Moves.Pursuit, target, 0);
      caught.delete(unit);
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
