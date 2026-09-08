import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { DamageFlags, Moves } from '../../data/ids/moves';
import type Battle from '../core';
import { BattleEvents } from '../events';
import type Unit from '../unit';

/**
 * The two moves that answer for what happened while they were being
 * wound up.
 *
 * Both are cast slowly on purpose: the wind-up is the window somebody
 * else gets to hit through. A Focus Punch is lost if they do; a
 * Revenge is worth twice as much. What counts is a hit from somebody
 * else that actually took health off, so a Leftovers tick, a
 * self-inflicted cost or a blocked hit leaves the punch standing.
 */
const CONCENTRATION_MOVES = new Set<Moves>([Moves.FocusPunch, Moves.Revenge]);

export default function setupFocusPunch(battle: Battle): void {
  /** Who was hit while winding one of these up, and is not over it */
  const struck = new Set<Unit>();

  function isWindingUp(unit: Unit): boolean {
    const move = unit.casting?.move;

    return move != null && CONCENTRATION_MOVES.has(move);
  }

  battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
    if (
      !event.success ||
      event.value <= 0 ||
      event.source === event.target ||
      (event.flags & DamageFlags.Cost) !== 0 ||
      !isWindingUp(event.target)
    ) {
      return;
    }

    struck.add(event.target);

    // The punch never lands: the concentration is what it was made of
    if (event.target.casting?.move === Moves.FocusPunch) {
      event.target.interrupt();
    }
  });

  // Twice as hard for having been hit, and the grudge is spent on the
  // one swing it paid for
  battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
    if (event.move === Moves.Revenge && event.power != null && struck.has(event.source)) {
      event.power *= 2;
    }
  });

  battle.on(BattleEvents.UnitTriggerMove, AttackPriority.Post, (event) => {
    if (CONCENTRATION_MOVES.has(event.move)) {
      struck.delete(event.source);
    }
  });

  for (const gone of [BattleEvents.UnitFaints, BattleEvents.UnitLeavesField] as const) {
    battle.on(gone, EventPriority.Post, (event) => {
      struck.delete(event.source);
    });
  }
}
