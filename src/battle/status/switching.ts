import { EventPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';

/**
 * How long a switch holds both ends of the swap, in battle
 * milliseconds. The walk the mechanics run, the canvas picture and
 * this lockout all measure the same span
 */
export const SWITCHING_SPAN = 1000;

export default function setupSwitchingStatus(battle: Battle): void {
  // Both ends of a swap spend the span mid-walk
  battle.on(BattleEvents.UnitSwitch, EventPriority.Post, (event) => {
    if (event.source === event.target) {
      return;
    }
    for (const unit of [event.source, event.target]) {
      unit.addStatus(Statuses.Switching, { type: EffectType.None });
    }
  });

  // The status ends with the walk rather than on a clock of its own:
  // one span, one authority, however the walk was fast-forwarded
  battle.on(BattleEvents.UnitFinishSwitch, EventPriority.Post, (event) => {
    for (const unit of new Set([event.source, event.target])) {
      if (unit.status[Statuses.Switching] != null) {
        unit.removeStatus(Statuses.Switching, { type: EffectType.None });
      }
    }
  });

  // The walk interrupts whatever either end was doing
  battle.on(BattleEvents.UnitAddStatus, EventPriority.Post, (event) => {
    if (event.status === Statuses.Switching) {
      event.source.interrupt();
    }
  });

  // Nothing acts mid-walk
  battle.on(BattleEvents.CheckUnitCanCast, EventPriority.Post, (event) => {
    if (event.success && event.source.status[Statuses.Switching] != null) {
      event.success = false;

      event.source.triggerStatus(Statuses.Switching, { type: EffectType.None });
    }
  });

  // And nothing lands on it: mid-walk is semi-invulnerable, and no
  // move reaches the spot between two spots. Pursuit is the exception
  // it is written to be, and says so here rather than overruling this
  // from somewhere else
  battle.on(BattleEvents.UnitTriggerMoveRollHit, EventPriority.Post, (event) => {
    const target = event.parent.target;

    if (
      event.hit &&
      event.parent.move !== Moves.Pursuit &&
      target.type === MoveTargetType.Unit &&
      target.unit.status[Statuses.Switching] != null
    ) {
      event.hit = false;
    }
  });
}
