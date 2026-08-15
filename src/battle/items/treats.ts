import { EventPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import type { Items } from '../../data/ids/items';
import { TREATS, TREAT_CURES } from '../../data/items/treats';
import type Battle from '../core';
import { BattleEvents, EffectType } from '../events';
import { type Lifecycle, MergedLifecycle } from '../lifecycle';
import type Unit from '../unit';
import { createHeldItems, holds, spendItem } from './__create';
import { DRINK_THRESHOLD } from './drinks';

/**
 * The regional treats, eaten by whoever is carrying one.
 *
 * A sweet answers a status and the candy bar answers an empty health
 * bar, so the two halves of the shelf are two different lifecycles
 * over the same table in
 * [`src/data/items/treats.ts`](../../data/items/treats.ts).
 */

/**
 * How long a sweet sits before it is eaten. Nobody unwraps a cake the
 * instant they are burned, and the pause is what the cure's animation
 * plays in
 */
export const TREAT_DELAY = 1000;

/**
 * Whether the holder still has anything a sweet would take off. A
 * status shrugged off during the pause leaves the sweet in its
 * wrapper
 */
function ailing(unit: Unit): boolean {
  for (const status of TREAT_CURES) {
    if (unit.status[status] != null) {
      return true;
    }
  }
  return false;
}

function setupSweet(battle: Battle, item: Items): Lifecycle {
  /**
   * How long each holder's sweet has left to sit. One countdown per
   * holder: a second status landing during the pause is cured by the
   * same mouthful rather than starting another
   */
  const waiting = new Map<Unit, number>();

  return new MergedLifecycle([
    battle.on(BattleEvents.UnitAddStatus, EventPriority.Post, (event) => {
      if (TREAT_CURES.has(event.status) && holds(event.source, item)) {
        if (!waiting.has(event.source)) {
          waiting.set(event.source, TREAT_DELAY);
        }
      }
    }),

    battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
      for (const [unit, remaining] of [...waiting]) {
        const left = remaining - event.duration;

        if (left > 0) {
          waiting.set(unit, left);
          continue;
        }

        waiting.delete(unit);

        if (unit.alive && ailing(unit)) {
          spendItem(unit, item);
        }
      }
    }),

    battle.on(BattleEvents.UnitTriggerItem, EventPriority.Exact, (event) => {
      if (event.item !== item) {
        return;
      }

      const unit = event.source;
      const cause = { type: EffectType.Item, item, unit } as const;

      for (const status of TREAT_CURES) {
        if (unit.status[status] != null) {
          unit.removeStatus(status, cause);
        }
      }
    }),
  ]);
}

// The candy bar is a drink in a wrapper: same threshold, same flat
// mouthful, so whatever moves one moves the other
function setupSnack(battle: Battle, item: Items, restore: number): Lifecycle {
  return new MergedLifecycle([
    battle.on(BattleEvents.UnitSetHealth, EventPriority.Post, (event) => {
      const unit = event.source;

      if (!unit.alive || unit.health <= 0) {
        return;
      }
      if (
        unit.health <=
        unit.checkStat(Stats.HP, 0) * unit.checkItemThreshold(item, DRINK_THRESHOLD)
      ) {
        spendItem(unit, item);
      }
    }),

    battle.on(BattleEvents.UnitTriggerItem, EventPriority.Exact, (event) => {
      if (event.item === item) {
        event.source.heal(
          { type: EffectType.Item, item, unit: event.source },
          event.source,
          restore,
          0,
        );
      }
    }),
  ]);
}

export default createHeldItems(
  () => TREATS.keys(),
  (battle, item: Items) => {
    const restore = TREATS.get(item)?.restore ?? 0;

    return restore > 0 ? setupSnack(battle, item, restore) : setupSweet(battle, item);
  },
);
