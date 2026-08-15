import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { GEMS } from '../../data/items/gems';
import { BattleEvents } from '../events';
import { MergedLifecycle } from '../lifecycle';
import { createHeldItems, holds, spendItem } from './__create';

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

export default createHeldItems(
  () => GEMS.keys(),
  (battle, item) => {
    const gemmed = GEMS.get(item);

    return new MergedLifecycle([
      battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
        if (event.power == null || !holds(event.source, item)) {
          return;
        }
        if (event.source.checkMoveType(event.move, event.target) === gemmed) {
          event.power *= GEM_FACTOR;
        }
      }),

      // Spent on the way out of the attack it lifted: the damage is
      // already resolved, so the gem is paid for rather than wasted.
      // `spendItem` disables it first, so it cannot lift a second hit
      // on its way out
      battle.on(BattleEvents.UnitAttack, AttackPriority.Cleanup, (event) => {
        if (event.success && event.type === gemmed) {
          spendItem(event.source, item);
        }
      }),
    ]);
  },
);
