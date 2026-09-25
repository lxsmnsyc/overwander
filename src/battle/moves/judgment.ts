import { EventPriority } from '../../core/event-emitter';
import type { Types } from '../../data/constants/types';
import type { Items } from '../../data/ids/items';
import { Moves } from '../../data/ids/moves';
import { DRIVES } from '../../data/items/drives';
import { MEMORIES } from '../../data/items/memories';
import { PLATES } from '../../data/items/plates';
import type Battle from '../core';
import { BattleEvents } from '../events';

/**
 * The moves thrown as the type of what the user holds: Judgment reads a
 * Plate, Techno Blast a Drive and Multi-Attack a Memory, and each stays
 * Normal without one. Revelation Dance reads the user itself instead,
 * and is thrown as its first type. A
 * Plate also boosts its type, so Judgment stacks the two the way the
 * mainline does
 * https://bulbapedia.bulbagarden.net/wiki/Judgment_(move)
 */
const HELD_TYPES = new Map<Moves, Map<Items, Types>>([
  [Moves.Judgment, PLATES],
  [Moves.TechnoBlast, DRIVES],
  [Moves.MultiAttack, MEMORIES],
]);

export default function setupJudgment(battle: Battle): void {
  battle.on(BattleEvents.CheckUnitMoveType, EventPriority.Post, (event) => {
    if (event.move === Moves.RevelationDance) {
      if (event.source.types.size > 0) {
        [event.type] = event.source.types;
      }
      return;
    }

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
