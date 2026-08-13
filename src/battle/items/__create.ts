import { EventPriority } from '../../core/event-emitter';
import type { Items } from '../../data/ids/items';
import type Battle from '../core';
import { BattleEvents, type EffectCause, EffectType, type UnitAttackEvent } from '../events';
import type { Lifecycle } from '../lifecycle';
import type Unit from '../unit';

/**
 * What every held item needs before it can do anything: whether it is
 * being held, how it is spent, and whether the blow it is answering
 * landed hard — and the switch that keeps a whole shelf of them out of
 * the battle until somebody actually carries one.
 */

/**
 * Wire up a family of held items, listening only while one is held.
 *
 * It is the item half of
 * [`createAbility`](../abilities/__create.ts): the family's listeners
 * are built once and left stopped, started when the first unit picks
 * anything in the family up, and stopped again when the last one puts
 * it down. A raid where nobody carries a berry is a raid that does not
 * run the berry listeners at all.
 *
 * The gate is deliberately **per family rather than per item**, which
 * is where it differs from an ability. Abilities are one listener
 * each; item modules are table-driven, so one listener already serves
 * every gem, every plate and every berry, and gating each item
 * separately would multiply listeners rather than remove them.
 *
 * It keys on the item being **held**, not on it being enabled. An item
 * that fires is disabled before its effect runs — see `spendItem` —
 * so a gate that closed on the disable would tear its own listeners
 * down halfway through the effect they were listening for. The gate
 * closes on removal, and the family's own listeners are registered
 * ahead of it, so anything the family does about an item going away
 * has already run by the time the switch is thrown.
 *
 * The item list is resolved lazily because a family may be read off
 * the item registry, which is filled after the battle is wired
 */
export function createHeldItems(
  items: () => Iterable<Items>,
  setup: (battle: Battle) => Lifecycle,
) {
  return (battle: Battle): void => {
    const lifecycle = setup(battle);

    // Nobody has picked anything up yet
    lifecycle.stop();

    let family: Set<Items> | null = null;
    const holders = new Set<Unit>();

    function inFamily(item: Items): boolean {
      family ??= new Set(items());
      return family.has(item);
    }

    function stillHolding(unit: Unit): boolean {
      for (const key in unit.items) {
        // tsc requires the assertion to index the Items-mapped record;
        // tsgolint resolves the const enum to number and disagrees
        // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
        const item = Number(key) as Items;

        if (unit.items[item] != null && inFamily(item)) {
          return true;
        }
      }
      return false;
    }

    battle.on(BattleEvents.UnitAddItem, EventPriority.Post, (event) => {
      if (inFamily(event.item)) {
        holders.add(event.source);

        if (holders.size === 1) {
          lifecycle.start();
        }
      }
    });

    battle.on(BattleEvents.UnitRemoveItem, EventPriority.Post, (event) => {
      // A unit may carry more than one of a family where the battle
      // allows it, so what matters is whether it has any left
      if (inFamily(event.item) && !stillHolding(event.source)) {
        holders.delete(event.source);

        if (holders.size === 0) {
          lifecycle.stop();
        }
      }
    });
  };
}

/**
 * Whether the unit is holding the item and able to use it. A disabled
 * item is still in its holder's grip but does nothing — that is how an
 * item that has already fired is kept from firing again while the
 * effect it started is still running
 */
export function holds(unit: Unit, item: Items): boolean {
  return unit.items[item] === true;
}

/**
 * Spend a held item, and answer with the cause its effect should be
 * written down under. Undefined means the item was not there to spend
 * or its holder is not allowed to spend one — an enemy Unnerve keeps a
 * berry uneaten, and it keeps a sash unspent for the same reason.
 *
 * The order matters. The item is disabled before the trigger fires, so
 * that an effect which loops back through the detection — a heal that
 * re-enters the health check, a stage that re-enters the stage one —
 * cannot find the item still spendable and spend it twice
 */
export function spendItem(unit: Unit, item: Items): EffectCause | undefined {
  if (!holds(unit, item) || !unit.checkCanConsumeItem(item)) {
    return undefined;
  }

  const cause = { type: EffectType.Item, item, unit } as const;

  unit.disableItem(item);
  unit.triggerItem(item);
  unit.removeItem(item, cause);

  return cause;
}

/**
 * How hard each attack is landing, totalled as the defending types are
 * worked through.
 *
 * Everything that waits to be hit *hard* — a resist berry, an Enigma,
 * a Weakness Policy, an Expert Belt — turns on whether the blow is
 * super-effective overall, which no single defending type can answer:
 * a Fire move on a Grass/Water pokemon is neither of its halves. So
 * the multipliers are accumulated per attack and read back once the
 * attack has resolved
 */
export function createEffectivenessTracker(battle: Battle): (parent: UnitAttackEvent) => boolean {
  const effectiveness = new WeakMap<UnitAttackEvent, number>();

  battle.on(BattleEvents.UnitAttackResolveEffectiveness, EventPriority.Post, (event) => {
    effectiveness.set(event.parent, (effectiveness.get(event.parent) ?? 1) * event.multiplier);
  });

  return (parent: UnitAttackEvent): boolean => (effectiveness.get(parent) ?? 1) > 1;
}
