import { EventPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import type { Items } from '../../data/ids/items';
import { DRINKS } from '../../data/items/drinks';
import { BattleEvents, EffectType } from '../events';
import { MergedLifecycle } from '../lifecycle';
import { createHeldItems, spendItem } from './__create';

/**
 * The drinks, drunk by whoever is holding one the moment they are
 * nearly out.
 *
 * Nobody decides to drink: a held drink goes down on its own, the way
 * a berry does, because there is no moment in a real-time fight for a
 * player to hand one over. What separates it from a berry is where it
 * comes from — a berry is grown or found, a drink is bought by anybody
 * walking past a machine.
 */

/**
 * How far down a holder has to be. It is lower than a berry's quarter:
 * a drink is the cheaper answer, so it comes later and leaves less
 * room to be saved by it
 */
export const DRINK_THRESHOLD = 0.2;

export default createHeldItems(
  () => DRINKS.keys(),
  (battle, item: Items) => {
    const restore = DRINKS.get(item)?.restore ?? 0;

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitSetHealth, EventPriority.Post, (event) => {
        const unit = event.source;

        if (!unit.alive || unit.health <= 0) {
          return;
        }
        // Through the unit, so whatever moves the threshold — a
        // Gluttony — moves it for a drink as well as for a berry
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
  },
);
