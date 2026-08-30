import { EventPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, type EffectCause, EffectType, MoveTargetType } from '../events';
import type Unit from '../unit';

/**
 * How long a switch holds both ends of the swap, in battle
 * milliseconds. The walk the mechanics run, the canvas picture and
 * this lockout all measure the same span
 */
export const SWITCHING_SPAN = 1000;

/**
 * The moves that take a pokemon **out of the world** rather than
 * across the field. Everything else is a walk: the pair change places
 * in front of everybody, and a fight already under way carries on
 * over them
 */
const VANISHING_MOVES = new Set<Moves>([Moves.Teleport]);

/** Whether this walk is a vanishing rather than an ordinary swap. */
function isVanishing(cause: EffectCause | undefined): boolean {
  return cause != null && cause.type === EffectType.Move && VANISHING_MOVES.has(cause.move);
}

/** The same, read off whatever the unit is carrying. */
function vanished(unit: Unit): boolean {
  return isVanishing(unit.status[Statuses.Switching]);
}

export default function setupSwitchingStatus(battle: Battle): void {
  // Both ends of a swap spend the span mid-walk, carrying what sent
  // them: the cause is what the checks below read
  battle.on(BattleEvents.UnitSwitch, EventPriority.Post, (event) => {
    if (event.source === event.target) {
      return;
    }
    for (const unit of [event.source, event.target]) {
      unit.addStatus(Statuses.Switching, event.cause);
    }
  });

  // The status ends with the walk rather than on a clock of its own:
  // one span, one authority, however the walk was fast-forwarded
  battle.on(BattleEvents.UnitFinishSwitch, EventPriority.Post, (event) => {
    for (const unit of new Set([event.source, event.target])) {
      if (unit.status[Statuses.Switching] != null) {
        unit.removeStatus(Statuses.Switching, event.cause);
      }
    }
  });

  // A vanishing interrupts whatever the pair were doing, because
  // neither of them is there any more. A walk does not: a pokemon
  // crossing the field keeps casting what it had started
  battle.on(BattleEvents.UnitAddStatus, EventPriority.Post, (event) => {
    if (event.status === Statuses.Switching && isVanishing(event.cause)) {
      event.source.interrupt();
    }
  });

  // And only a vanishing stops them acting. Walking is not a reason
  // to stand still
  battle.on(BattleEvents.CheckUnitCanCast, EventPriority.Post, (event) => {
    if (event.success && vanished(event.source)) {
      event.success = false;

      event.source.triggerStatus(Statuses.Switching, { type: EffectType.None });
    }
  });

  // Nothing lands on somebody who is not there. A pokemon merely
  // walking is there, so a move aimed at it follows it through the
  // swap and lands
  battle.on(BattleEvents.UnitTriggerMoveRollHit, EventPriority.Post, (event) => {
    const target = event.parent.target;

    if (event.hit && target.type === MoveTargetType.Unit && vanished(target.unit)) {
      event.hit = false;
    }
  });
}
