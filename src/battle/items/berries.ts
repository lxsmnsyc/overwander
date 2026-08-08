import { EventPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import { Items } from '../../data/ids/items';
import { Statuses } from '../../data/ids/status';
import type { Battle } from '../core';
import { BattleEvents, type EffectCause, EffectType } from '../events';
import type { Unit } from '../unit';

/**
 * Held berries that trigger on their own in battle. Eating a berry
 * always consumes it; a unit prevented from consuming (e.g. by an
 * enemy Unnerve) keeps the berry for later.
 */

const STATUS_CURE_BERRIES: { [key in Items]?: Statuses[] } = {
  [Items.CheriBerry]: [Statuses.Paralyzed],
  [Items.ChestoBerry]: [Statuses.Sleeping],
  [Items.PechaBerry]: [Statuses.Poisoned, Statuses.BadlyPoisoned],
  [Items.RawstBerry]: [Statuses.Burned],
  [Items.AspearBerry]: [Statuses.Frozen],
  [Items.PersimBerry]: [Statuses.Confused],
  [Items.LumBerry]: [
    Statuses.Paralyzed,
    Statuses.Sleeping,
    Statuses.Poisoned,
    Statuses.BadlyPoisoned,
    Statuses.Burned,
    Statuses.Frozen,
    Statuses.Confused,
  ],
};

interface HealBerryConfig {
  /**
   * Fraction of max health at (or below) which the berry triggers
   */
  threshold: number;
  heal: (maxHealth: number) => number;
}

const HEAL_BERRIES: { [key in Items]?: HealBerryConfig } = {
  [Items.OranBerry]: { threshold: 0.5, heal: () => 10 },
  [Items.SitrusBerry]: { threshold: 0.5, heal: max => max / 4 },
};

export function setupBerries(battle: Battle) {
  function eat(unit: Unit, item: Items): EffectCause | undefined {
    if (unit.items[item] !== true || !unit.checkCanConsumeItem(item)) {
      return undefined;
    }

    // For visual cues
    unit.triggerItem(item);
    unit.removeItem(item);

    return { type: EffectType.Item, item, unit };
  }

  function heldBerries(unit: Unit) {
    const held: Items[] = [];

    for (const key in unit.items) {
      if (unit.items[Number(key) as Items] === true) {
        held.push(Number(key) as Items);
      }
    }

    return held;
  }

  // Status-cure berries eat themselves the moment the status lands
  battle.on(BattleEvents.UnitAddStatus, EventPriority.Post, event => {
    for (const item of heldBerries(event.source)) {
      const cures = STATUS_CURE_BERRIES[item];

      if (cures?.includes(event.status)) {
        const cause = eat(event.source, item);

        if (cause) {
          event.source.removeStatus(event.status, cause);
          return;
        }
      }
    }
  });

  // Healing berries trigger when health drops to the threshold
  battle.on(BattleEvents.UnitSetHealth, EventPriority.Post, event => {
    const unit = event.source;

    if (!unit.alive || unit.health <= 0) {
      return;
    }

    const maxHealth = unit.checkStat(Stats.HP, 0);

    for (const item of heldBerries(unit)) {
      const config = HEAL_BERRIES[item];

      if (config && unit.health <= maxHealth * config.threshold) {
        // Consume first: the heal re-enters UnitSetHealth
        const cause = eat(unit, item);

        if (cause) {
          unit.heal(cause, unit, config.heal(maxHealth), 0);
          return;
        }
      }
    }
  });

  /**
   * Leppa restores a depleted move. The cooldown is this engine's
   * stand-in for spent PP, so the berry clears it as it starts.
   */
  battle.on(BattleEvents.UnitStartCooldown, EventPriority.Post, event => {
    if (eat(event.source, Items.LeppaBerry)) {
      event.source.finishCooldown(event.move);
    }
  });
}
