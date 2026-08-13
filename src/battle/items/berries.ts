import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import { ItemTypes, Items } from '../../data/ids/items';
import { DamageFlags, MoveCategories } from '../../data/ids/moves';
import { NATURE_EFFECTS } from '../../data/ids/natures';
import { Statuses } from '../../data/ids/status';
import {
  BERRY_BRACE_STAGES,
  BERRY_HEALS,
  BERRY_NATURE_HEALS,
  BERRY_NATURE_HEAL_SHARE,
  BERRY_NATURE_HEAL_THRESHOLD,
  BERRY_PAYBACK_SHARE,
  BERRY_PINCH_STAGES,
  BERRY_PINCH_THRESHOLD,
  BERRY_RESIST_FACTOR,
  BERRY_RESIST_TYPES,
  BERRY_STATUS_CURES,
  CUSTAP_PRIORITY,
  ENIGMA_HEAL_SHARE,
  LANSAT_CRITICAL_STAGES,
  MICLE_ACCURACY,
  PINCH_BERRIES,
  STARF_STAGES,
  STARF_STAGE_AMOUNT,
} from '../../data/items/berries';
import { Types } from '../../data/constants/types';
import { listItemsByType } from '../../data/items';
import { BattleEvents, EffectType, type UnitAttackEvent } from '../events';
import { MergedLifecycle } from '../lifecycle';
import type Unit from '../unit';
import { createEffectivenessTracker, createHeldItems, spendItem } from './__create';

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

export default createHeldItems(
  () => listItemsByType(ItemTypes.Berry),
  (battle) => {
    const landingHard = createEffectivenessTracker(battle);

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

    /**
     * What the three berries that buy a moment rather than a stat have
     * left owing. A Lansat sharpens its holder for the rest of the
     * fight; a Custap and a Micle each pay for one move and are spent
     * by it
     */
    const sharpened = new Set<Unit>();
    const hurried = new Set<Unit>();
    const steadied = new Set<Unit>();

    /**
     * Which resist berry the target is holding against this blow, if
     * any. Chilan is the exception the table cannot express: nothing is
     * weak to Normal, so a berry that waited to be hit hard by one
     * would never be eaten at all
     */
    function resistBerry(parent: UnitAttackEvent): Items | undefined {
      for (const item of heldBerries(parent.target)) {
        const resisted = BERRY_RESIST_TYPES.get(item);

        if (resisted !== parent.type) {
          continue;
        }
        if (resisted === Types.Normal || landingHard(parent)) {
          return item;
        }
      }
      return undefined;
    }

    const listening = new MergedLifecycle([
      // Detection: status-cure berries eat themselves the moment a
      // covered status lands
      battle.on(BattleEvents.UnitAddStatus, EventPriority.Post, (event) => {
        for (const item of heldBerries(event.source)) {
          if (
            BERRY_STATUS_CURES.get(item)?.has(event.status) === true &&
            spendItem(event.source, item)
          ) {
            return;
          }
        }
      }),

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
            spendItem(unit, item)
          ) {
            return;
          }
        }
      }),

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
      }),

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
      }),

      /**
       * Leppa restores a depleted move. The cooldown is this engine's
       * stand-in for spent PP, so the berry clears it as it starts. The
       * effect needs the move from the detection event, which the trigger
       * cannot carry, so it stays inline.
       */
      battle.on(BattleEvents.UnitStartCooldown, EventPriority.Post, (event) => {
        if (spendItem(event.source, Items.LeppaBerry)) {
          event.source.finishCooldown(event.move);
        }
      }),

      /**
       * Detection and effect at once: a resist berry has to take its half
       * off the damage that is being resolved, which is a number the
       * trigger cannot reach
       */
      battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
        const item = resistBerry(event.parent);

        if (item != null && spendItem(event.parent.target, item)) {
          event.value *= BERRY_RESIST_FACTOR;
        }
      }),

      /**
       * The berries that answer a blow after it has landed: what the
       * holder gets back, what they brace with, and what the one who hit
       * them pays for it. All of them read the attack, so all of them are
       * detected here — a berry with nothing to answer stays held
       */
      battle.on(BattleEvents.UnitAttack, AttackPriority.Cleanup, (event) => {
        const holder = event.target;

        if (!event.success || event.category === MoveCategories.Status || !holder.alive) {
          return;
        }

        const maxHealth = holder.checkStat(Stats.HP, 0);
        const physical = event.category === MoveCategories.Physical;

        // A hard hit is worth a quarter of the holder back
        if (landingHard(event)) {
          const cause = spendItem(holder, Items.EnigmaBerry);

          if (cause) {
            holder.heal(cause, holder, Math.max(1, Math.floor(maxHealth * ENIGMA_HEAL_SHARE)), 0);
          }
        }

        // Kee braces against the physical, Maranga against the special
        for (const [item, stage] of BERRY_BRACE_STAGES) {
          if (physical === (item === Items.KeeBerry)) {
            const cause = spendItem(holder, item);

            if (cause) {
              holder.addStage(stage, 1, cause);
            }
          }
        }

        // And the paybacks take a share out of whoever threw the blow.
        // Indirect, so nothing about the attack — drain, recoil, a berry
        // of the attacker's own — reads it as a hit
        const payback = physical ? Items.JabocaBerry : Items.RowapBerry;
        const cause = spendItem(holder, payback);

        if (cause && event.source.alive) {
          const share = Math.max(
            1,
            Math.floor(event.source.checkStat(Stats.HP, 0) * BERRY_PAYBACK_SHARE),
          );

          event.source.damage(cause, event.source, share, DamageFlags.Indirect);
        }
      }),

      /**
       * Detection: everything that waits for its holder to be nearly out.
       * The threshold goes through the unit so that whatever moves it —
       * Gluttony, say — moves all of them together
       */
      battle.on(BattleEvents.UnitSetHealth, EventPriority.Post, (event) => {
        const unit = event.source;

        if (!unit.alive || unit.health <= 0) {
          return;
        }

        const maxHealth = unit.checkStat(Stats.HP, 0);

        for (const item of heldBerries(unit)) {
          const pinch = BERRY_PINCH_STAGES.has(item) || PINCH_BERRIES.has(item);
          const bitter = BERRY_NATURE_HEALS.has(item);

          if (!pinch && !bitter) {
            continue;
          }

          const threshold = bitter ? BERRY_NATURE_HEAL_THRESHOLD : BERRY_PINCH_THRESHOLD;

          if (
            unit.health <= maxHealth * unit.checkItemThreshold(item, threshold) &&
            spendItem(unit, item)
          ) {
            return;
          }
        }
      }),

      // Effect: the pinch berries lift a stat as they go
      battle.on(BattleEvents.UnitTriggerItem, EventPriority.Exact, (event) => {
        const stage = BERRY_PINCH_STAGES.get(event.item);

        if (stage != null) {
          event.source.addStage(stage, 1, {
            type: EffectType.Item,
            item: event.item,
            unit: event.source,
          });
        }
      }),

      // Effect: a Starf lifts one stat by two, and which one is the price
      // of it being worth two
      battle.on(BattleEvents.UnitTriggerItem, EventPriority.Exact, (event) => {
        if (event.item !== Items.StarfBerry) {
          return;
        }

        const stage = STARF_STAGES[Math.floor(battle.random() * STARF_STAGES.length)];

        event.source.addStage(stage, STARF_STAGE_AMOUNT, {
          type: EffectType.Item,
          item: event.item,
          unit: event.source,
        });
      }),

      /**
       * Effect: a bitter berry gives back a third — and a third of the
       * holders cannot stand the taste. Whether it turns their stomach is
       * their nature's business: the one that lowers the stat the berry's
       * flavour belongs to is the one that dislikes it
       */
      battle.on(BattleEvents.UnitTriggerItem, EventPriority.Exact, (event) => {
        const flavour = BERRY_NATURE_HEALS.get(event.item);

        if (flavour == null) {
          return;
        }

        const unit = event.source;
        const cause = { type: EffectType.Item, item: event.item, unit } as const;
        const maxHealth = unit.checkStat(Stats.HP, 0);

        unit.heal(cause, unit, Math.max(1, Math.floor(maxHealth * BERRY_NATURE_HEAL_SHARE)), 0);

        if (NATURE_EFFECTS[unit.nature]?.down === flavour) {
          unit.addStatus(Statuses.Confused, cause);
        }
      }),

      battle.on(BattleEvents.UnitTriggerItem, EventPriority.Exact, (event) => {
        if (event.item === Items.LansatBerry) {
          sharpened.add(event.source);
        }
        if (event.item === Items.CustapBerry) {
          hurried.add(event.source);
        }
        if (event.item === Items.MicleBerry) {
          steadied.add(event.source);
        }
      }),

      battle.on(BattleEvents.UnitAttackCheckCriticalRatio, EventPriority.Post, (event) => {
        if (sharpened.has(event.parent.source)) {
          event.value += LANSAT_CRITICAL_STAGES;
        }
      }),

      battle.on(BattleEvents.CheckUnitMovePriority, EventPriority.Post, (event) => {
        if (hurried.has(event.source)) {
          event.priority += CUSTAP_PRIORITY;
        }
      }),

      battle.on(BattleEvents.CheckUnitMoveAccuracy, EventPriority.Post, (event) => {
        if (event.accuracy != null && steadied.has(event.source)) {
          event.accuracy *= MICLE_ACCURACY;
        }
      }),

      // Both are spent by the move they paid for, whether or not it
      // landed: the hurry was already had, and the aim was already taken
      battle.on(BattleEvents.UnitAttack, AttackPriority.Cleanup, (event) => {
        hurried.delete(event.source);
        steadied.delete(event.source);
      }),

      // Nothing carries off the field: a unit that has left is not the
      // one that comes back
      battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
        sharpened.delete(event.source);
        hurried.delete(event.source);
        steadied.delete(event.source);
      }),
    ]);

    return {
      start: () => {
        listening.start();
      },
      /**
       * A Lansat sharpens its holder for the rest of the fight, and a
       * Custap and a Micle each carry into the next move — all of them
       * long after the berry itself is gone. So the family refuses to
       * be switched off while anything is still owing, even though
       * nobody is holding a berry any more
       */
      stop: () => {
        if (sharpened.size === 0 && hurried.size === 0 && steadied.size === 0) {
          listening.stop();
        }
      },
    };
  },
);
