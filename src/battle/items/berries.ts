import { EventPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import { Items } from '../../data/ids/items';
import { BERRY_HEALS, BERRY_STATUS_CURES } from '../../data/items/berries';
import type Battle from '../core';
import { BattleEvents, type EffectCause, EffectType } from '../events';
import type Unit from '../unit';

/**
 * Held berries that trigger on their own in battle. Eating a berry
 * always consumes it; a unit prevented from consuming (e.g. by an
 * enemy Unnerve) keeps the berry for later.
 */

/**
 * What a berry cures and what it restores is the berry's own
 * business, written once in
 * [`src/data/items/berries.ts`](../../data/items/berries.ts) and read
 * here as well as by the player handing one over between fights. The
 * threshold in a heal is a battle rule: it is what the
 * CheckUnitItemThreshold event opens with, and abilities like
 * Gluttony adjust it there
 */

export default function setupBerries(battle: Battle): void {
  function eat(unit: Unit, item: Items): EffectCause | undefined {
    if (unit.items[item] !== true || !unit.checkCanConsumeItem(item)) {
      return undefined;
    }

    const cause = { type: EffectType.Item, item, unit } as const;

    // Disable first: the berry's effect rides the trigger, and a heal
    // re-entering the detection must not see the berry as still edible
    unit.disableItem(item);
    unit.triggerItem(item);
    unit.removeItem(item, cause);

    return cause;
  }

  function heldBerries(unit: Unit): Items[] {
    const held: Items[] = [];

    for (const key in unit.items) {
      // tsc requires the assertion to index the Items-mapped record;
      // tsgolint resolves the const enum to number and disagrees
      // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
      const item = Number(key) as Items;
      if (unit.items[item] === true) {
        held.push(item);
      }
    }

    return held;
  }

  // Detection: status-cure berries eat themselves the moment a
  // covered status lands
  battle.on(BattleEvents.UnitAddStatus, EventPriority.Post, (event) => {
    for (const item of heldBerries(event.source)) {
      if (BERRY_STATUS_CURES.get(item)?.has(event.status) === true && eat(event.source, item)) {
        return;
      }
    }
  });

  // Detection: healing berries trigger when health drops to the
  // unit's resolved threshold
  battle.on(BattleEvents.UnitSetHealth, EventPriority.Post, (event) => {
    const unit = event.source;

    if (!unit.alive || unit.health <= 0) {
      return;
    }

    const maxHealth = unit.checkStat(Stats.HP, 0);

    for (const item of heldBerries(unit)) {
      const config = BERRY_HEALS.get(item);

      if (
        config != null &&
        unit.health <= maxHealth * unit.checkItemThreshold(item, config.threshold) &&
        eat(unit, item)
      ) {
        return;
      }
    }
  });

  // Effect: the cure rides the trigger, clearing every covered
  // status the unit currently has
  battle.on(BattleEvents.UnitTriggerItem, EventPriority.Exact, (event) => {
    const cures = BERRY_STATUS_CURES.get(event.item);

    if (cures) {
      const cause = { type: EffectType.Item, item: event.item, unit: event.source } as const;

      for (const status of cures) {
        if (event.source.status[status] != null) {
          event.source.removeStatus(status, cause);
        }
      }
    }
  });

  // Effect: the heal rides the trigger
  battle.on(BattleEvents.UnitTriggerItem, EventPriority.Exact, (event) => {
    const config = BERRY_HEALS.get(event.item);

    if (config) {
      const maxHealth = event.source.checkStat(Stats.HP, 0);

      event.source.heal(
        { type: EffectType.Item, item: event.item, unit: event.source },
        event.source,
        config.heal(maxHealth),
        0,
      );
    }
  });

  /**
   * Leppa restores a depleted move. The cooldown is this engine's
   * stand-in for spent PP, so the berry clears it as it starts. The
   * effect needs the move from the detection event, which the trigger
   * cannot carry, so it stays inline.
   */
  battle.on(BattleEvents.UnitStartCooldown, EventPriority.Post, (event) => {
    if (eat(event.source, Items.LeppaBerry)) {
      event.source.finishCooldown(event.move);
    }
  });
}
