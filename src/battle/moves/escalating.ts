import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents } from '../events';
import type Unit from '../unit';

/**
 * The moves that build while they keep landing, and how many times
 * they may double before they stop growing.
 *
 * The rolling moves used to be here. They double between their own
 * passes now rather than between casts: see `rolling.ts`
 */
const ESCALATING_MOVES: { [key in Moves]?: number } = {
  [Moves.FuryCutter]: 3,
};

interface Streak {
  move: Moves;
  landed: number;
}

/**
 * A streak is broken by anything else the unit casts, so the doubling
 * is paid for by casting nothing but the one move. The first cast is
 * the plain one: what is counted here is how many have gone before
 */
export default function setupEscalatingMoves(battle: Battle): void {
  const streaks = new Map<Unit, Streak>();

  battle.on(BattleEvents.UnitTriggerMove, AttackPriority.Post, (event) => {
    const cap = ESCALATING_MOVES[event.move];

    if (cap == null) {
      streaks.delete(event.source);
      return;
    }

    const streak = streaks.get(event.source);

    streaks.set(event.source, {
      move: event.move,
      landed: streak?.move === event.move ? Math.min(streak.landed + 1, cap) : 1,
    });
  });

  // The power is read before the move lands, so the streak counted
  // here is what came before this cast
  battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
    const cap = ESCALATING_MOVES[event.move];

    if (cap == null || event.power == null) {
      return;
    }

    const streak = streaks.get(event.source);
    const landed = streak?.move === event.move ? streak.landed : 0;

    event.power *= 2 ** landed;
  });

  function forget(unit: Unit): void {
    streaks.delete(unit);
  }

  battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
    forget(event.source);
  });

  battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
    forget(event.source);
  });

  // A unit that flinched or was otherwise stopped mid-roll starts over
  battle.on(BattleEvents.UnitAddStatus, EventPriority.Post, (event) => {
    if (event.status === Statuses.Flinched) {
      streaks.delete(event.source);
    }
  });
}
