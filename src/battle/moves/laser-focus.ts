import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import type Battle from '../core';
import { BattleEvents } from '../events';
import turns from '../turn';
import type Unit from '../unit';

/**
 * Laser Focus makes the user's next move land a critical hit. "Next
 * turn" is a window here: the focus holds for 2 turns' worth of time,
 * and the first move thrown inside it is the one it sharpens
 * https://bulbapedia.bulbagarden.net/wiki/Laser_Focus_(move)
 */
export const LASER_FOCUS_WINDOW = turns(2);

export default function setupLaserFocus(battle: Battle): void {
  /** Who is focused, and how long the focus has left */
  const focused = new Map<Unit, number>();
  /** The move each unit's focus went into */
  const sharpened = new Map<Unit, Moves>();

  battle.on(BattleEvents.UnitTriggerMove, AttackPriority.Pre, (event) => {
    sharpened.delete(event.source);
    if (event.move === Moves.LaserFocus) {
      return;
    }
    if (focused.delete(event.source)) {
      sharpened.set(event.source, event.move);
    }
  });

  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    if (event.move === Moves.LaserFocus) {
      focused.set(event.source, LASER_FOCUS_WINDOW);
    }
  });

  // Decided before the roll, so a Battle Armor can still turn it down
  battle.on(BattleEvents.UnitAttackResolveCriticalHit, EventPriority.Pre, (event) => {
    if (sharpened.get(event.parent.source) === event.parent.move) {
      event.critical = true;
    }
  });

  battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
    for (const [unit, left] of focused) {
      if (left > event.duration) {
        focused.set(unit, left - event.duration);
      } else {
        focused.delete(unit);
      }
    }
  });

  for (const gone of [BattleEvents.UnitFaints, BattleEvents.UnitLeavesField] as const) {
    battle.on(gone, EventPriority.Post, (event) => {
      focused.delete(event.source);
      sharpened.delete(event.source);
    });
  }
}
