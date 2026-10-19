import { type EventListenerLifecycle, EventPriority } from '../core/event-emitter';
import type Battle from './battle';
import { BattleEvents, type UnitCastEvent, type UnitChannelEvent } from './events';
import type Unit from './unit';

/**
 * The real-time stand-in for a mainline turn: fires when a unit
 * reaches for a move, cast or channelled, exactly once per move.
 *
 * A clock would pay a pokemon for standing still, and the end of a
 * cast would pay nothing for an interrupted move and nothing ever for
 * a channelled one. The listeners come back as a pair so an ability
 * can drop them into its own lifecycle
 */
export default function onUnitActs(
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
