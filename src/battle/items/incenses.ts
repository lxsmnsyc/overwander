import { EventPriority } from '../../core/event-emitter';
import { Items } from '../../data/ids/items';
import type Battle from '../core';
import { BattleEvents, MoveTargetType } from '../events';
import { createHeldItem, holds } from './__create';

/**
 * The incenses that do something in a battle other than lift a type.
 * The five that lift one ride the type-booster listener instead, in
 * [`./type-boosters.ts`](./type-boosters.ts).
 */

/**
 * What a Lax Incense takes off the accuracy of anything aimed at its
 * holder. Small, and it applies to every attack rather than a chosen
 * one, which is what makes it worth a held slot
 */
export const LAX_INCENSE_EVASION = 0.95;

/**
 * What a Full Incense costs its holder in priority. A move a bracket
 * slower is a move that lands after the answer to it, which is the
 * price of whatever the holder is carrying it for
 */
export const FULL_INCENSE_PRIORITY = 1;

// Lax Incense: harder to hit, so it is read off the unit being aimed
// at rather than the one aiming
const setupLaxIncense = createHeldItem(Items.LaxIncense, (battle) =>
  battle.on(BattleEvents.CheckUnitMoveAccuracy, EventPriority.Post, (event) => {
    if (event.accuracy == null || event.target.type !== MoveTargetType.Unit) {
      return;
    }
    if (holds(event.target.unit, Items.LaxIncense)) {
      event.accuracy *= LAX_INCENSE_EVASION;
    }
  }),
);

// Full Incense: its holder acts a bracket later than it otherwise
// would, which in a real-time fight is a longer wind-up
const setupFullIncense = createHeldItem(Items.FullIncense, (battle) =>
  battle.on(BattleEvents.CheckUnitMovePriority, EventPriority.Post, (event) => {
    if (holds(event.source, Items.FullIncense)) {
      event.priority -= FULL_INCENSE_PRIORITY;
    }
  }),
);

export default function setupBattleIncenses(battle: Battle): void {
  setupLaxIncense(battle);
  setupFullIncense(battle);
}
