import { EventPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import { Items } from '../../data/ids/items';
import { HONEY_RESTORE, HONEY_THRESHOLD } from '../../data/items/honey';
import { BattleEvents, EffectType } from '../events';
import { MergedLifecycle } from '../lifecycle';
import { createHeldItems, spendItem } from './__create';

export default createHeldItems(
  () => [Items.Honey],
  (battle, item: Items) =>
    new MergedLifecycle([
      battle.on(BattleEvents.UnitSetHealth, EventPriority.Post, (event) => {
        const unit = event.source;

        if (!unit.alive || unit.health <= 0) {
          return;
        }
        // Through the unit, so a Gluttony moves the threshold for a
        // jar of honey the same way it does for a berry
        if (
          unit.health <=
          unit.checkStat(Stats.HP, 0) * unit.checkItemThreshold(item, HONEY_THRESHOLD)
        ) {
          spendItem(unit, item);
        }
      }),

      battle.on(BattleEvents.UnitTriggerItem, EventPriority.Exact, (event) => {
        if (event.item === item) {
          event.source.heal(
            { type: EffectType.Item, item, unit: event.source },
            event.source,
            HONEY_RESTORE,
            0,
          );
        }
      }),
    ]),
);
