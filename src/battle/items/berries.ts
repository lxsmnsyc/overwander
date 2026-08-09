import { EventPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import { Items } from '../../data/ids/items';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, type EffectCause, EffectType } from '../events';
import type Unit from '../unit';

/**
 * Held berries that trigger on their own in battle. Eating a berry
 * always consumes it; a unit prevented from consuming (e.g. by an
 * enemy Unnerve) keeps the berry for later.
 */

const STATUS_CURE_BERRIES: { [key in Items]?: Set<Statuses> } = {
  [Items.CheriBerry]: new Set([Statuses.Paralyzed]),
  [Items.ChestoBerry]: new Set([Statuses.Sleeping]),
  [Items.PechaBerry]: new Set([Statuses.Poisoned, Statuses.BadlyPoisoned]),
  [Items.RawstBerry]: new Set([Statuses.Burned]),
  [Items.AspearBerry]: new Set([Statuses.Frozen]),
  [Items.PersimBerry]: new Set([Statuses.Confused]),
  [Items.LumBerry]: new Set([
    Statuses.Paralyzed,
    Statuses.Sleeping,
    Statuses.Poisoned,
    Statuses.BadlyPoisoned,
    Statuses.Burned,
    Statuses.Frozen,
    Statuses.Confused,
  ]),
};

interface HealBerryConfig {
  /**
   * Fraction of max health at (or below) which the berry triggers;
   * the base value of the CheckUnitItemThreshold event (abilities
   * like Gluttony adjust it there)
   */
  threshold: number;
  heal: (maxHealth: number) => number;
}

const HEAL_BERRIES: { [key in Items]?: HealBerryConfig } = {
  [Items.OranBerry]: { threshold: 0.5, heal: () => 10 },
  [Items.SitrusBerry]: { threshold: 0.5, heal: (max) => max / 4 },
};

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
      if (STATUS_CURE_BERRIES[item]?.has(event.status) && eat(event.source, item)) {
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
      const config = HEAL_BERRIES[item];

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
    const cures = STATUS_CURE_BERRIES[event.item];

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
    const config = HEAL_BERRIES[event.item];

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
