import { EventPriority } from '../../core/event-emitter';
import type { Types } from '../../data/constants/types';
import type { Items } from '../../data/ids/items';
import { Moves } from '../../data/ids/moves';
import { DRIVES } from '../../data/items/drives';
import { PLATES } from '../../data/items/plates';
import type Battle from '../core';
import { BattleEvents } from '../events';

/**
 * The moves thrown as the type of what the user holds: Judgment reads a
 * Plate and Techno Blast a Drive, and both stay Normal without one. A
 * Plate also boosts its type, so Judgment stacks the two the way the
 * mainline does
 * https://bulbapedia.bulbagarden.net/wiki/Judgment_(move)
 */
const HELD_TYPES = new Map<Moves, Map<Items, Types>>([
  [Moves.Judgment, PLATES],
  [Moves.TechnoBlast, DRIVES],
]);

export default function setupJudgment(battle: Battle): void {
  battle.on(BattleEvents.CheckUnitMoveType, EventPriority.Post, (event) => {
    const table = HELD_TYPES.get(event.move);

    if (table == null) {
      return;
    }

    for (const [item, type] of table) {
      if (event.source.hasItem(item)) {
        event.type = type;
        return;
      }
    }
  });
}
