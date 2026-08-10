import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { GEMS } from '../../data/items/gems';
import type Battle from '../core';
import { BattleEvents, EffectType } from '../events';

/**
 * The gems: one hit, half again, and gone.
 *
 * A gem lifts the move while it is held and is spent when that move
 * actually lands, which is two separate moments on purpose. The power
 * check is asked speculatively — the AI rates every move it might
 * throw before throwing one — so spending the gem there would have a
 * pokemon eat its own gem thinking about a move it never used. The
 * attack window is where a move has really happened.
 */

/**
 * Half again, which is what a one-shot is worth next to the fifth a
 * type booster pays on every hit forever
 */
export const GEM_FACTOR = 1.5;

export default function setupGems(battle: Battle): void {
  battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
    if (event.power == null) {
      return;
    }

    const type = event.source.checkMoveType(event.move, event.target);

    for (const [item, gemmed] of GEMS) {
      if (gemmed === type && event.source.items[item] === true) {
        event.power *= GEM_FACTOR;
        return;
      }
    }
  });

  // Spent on the way out of the attack it lifted: the damage is
  // already resolved, so the gem is paid for rather than wasted
  battle.on(BattleEvents.UnitAttack, AttackPriority.Cleanup, (event) => {
    if (!event.success) {
      return;
    }

    for (const [item, gemmed] of GEMS) {
      if (gemmed !== event.type || event.source.items[item] !== true) {
        continue;
      }
      if (!event.source.checkCanConsumeItem(item)) {
        return;
      }

      const cause = { type: EffectType.Item, item, unit: event.source } as const;

      // Disabled before the trigger, the way a berry is: the gem has
      // done its work and must not lift a second hit
      event.source.disableItem(item);
      event.source.triggerItem(item);
      event.source.removeItem(item, cause);
      return;
    }
  });
}
