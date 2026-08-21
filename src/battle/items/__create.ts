import { type EventListenerLifecycle, EventPriority } from '../../core/event-emitter';
import type { Stages } from '../../data/constants/stats';
import type { Items } from '../../data/ids/items';
import type Battle from '../core';
import {
  BattleEvents,
  type EffectCause,
  EffectType,
  type UnitAttackEvent,
  type UnitUpdateStageEvent,
} from '../events';
import type { Lifecycle } from '../lifecycle';
import type Unit from '../unit';

/**
 * What every held item needs before it can do anything: whether it is
 * being held, how it is spent, and whether the blow it is answering
 * landed hard — and the switch that keeps a whole shelf of them out of
 * the battle until somebody actually carries one.
 */

/**
 * What holds one item's listeners open: who is carrying it, and the
 * lifecycle that runs while anybody is
 */
interface ItemGate {
  hold: (unit: Unit) => void;
}

/**
 * Build the gate for one item. The lifecycle is created here rather
 * than at wiring time, so an item nobody in the battle ever picks up
 * costs a set lookup and nothing else — and so the item's own
 * listeners are registered **before** the gate's, which is what lets
 * anything it does about the item going away run before the gate
 * shuts
 */
function createItemGate(
  battle: Battle,
  item: Items,
  setup: (battle: Battle, item: Items) => Lifecycle,
): ItemGate {
  const lifecycle = setup(battle, item);
  const holders = new Set<Unit>();

  battle.on(BattleEvents.UnitRemoveItem, EventPriority.Post, (event) => {
    // The unit may be carrying another of the same kind where the
    // battle allows it, so what matters is whether any is left. A
    // disabled one still counts: it is in the grip, and `spendItem`
    // disables before the effect runs
    if (event.item !== item || event.source.items[item] != null) {
      return;
    }

    holders.delete(event.source);

    if (holders.size === 0) {
      lifecycle.stop();
    }
  });

  return {
    hold: (unit: Unit): void => {
      holders.add(unit);

      if (holders.size === 1) {
        lifecycle.start();
      }
    },
  };
}

/**
 * Wire up held items, one gate each: an item's listeners run while
 * somebody is carrying that item and at no other time. The item half
 * of [`createAbility`](../abilities/__create.ts), with `setup` called
 * once per item rather than once per family.
 *
 * The gate keys on the item being **held**, not enabled: an item that
 * fires is disabled before its effect runs (see `spendItem`), so a
 * gate closing on the disable would tear the listeners down mid-effect.
 *
 * The item list resolves lazily, because a family may be read off the
 * registry, which fills after the battle is wired
 */
export function createHeldItems(
  items: () => Iterable<Items>,
  setup: (battle: Battle, item: Items) => Lifecycle,
): (battle: Battle) => void {
  return (battle: Battle): void => {
    const gates = new Map<Items, ItemGate>();
    let known: Set<Items> | null = null;

    battle.on(BattleEvents.UnitAddItem, EventPriority.Post, (event) => {
      known ??= new Set(items());

      if (!known.has(event.item)) {
        return;
      }

      let gate = gates.get(event.item);

      if (gate == null) {
        gate = createItemGate(battle, event.item, setup);
        gates.set(event.item, gate);
      }
      gate.hold(event.source);
    });
  };
}

/**
 * One held item on its own, for a family of exactly one
 */
export function createHeldItem(
  item: Items,
  setup: (battle: Battle) => Lifecycle,
): (battle: Battle) => void {
  return createHeldItems(
    () => [item],
    (battle) => setup(battle),
  );
}

/**
 * The pair of listeners it takes to catch a stat going down
 */
export type StageListeners = [
  EventListenerLifecycle<UnitUpdateStageEvent>,
  EventListenerLifecycle<UnitUpdateStageEvent>,
];

/**
 * A stage can fall two ways: something takes one off, or something adds
 * a negative one — an Intimidate does the latter — so anything
 * answering a stat being lowered has to watch both
 */
export function lowering(
  battle: Battle,
  listener: (unit: Unit, stage: Stages, cause: EffectCause) => void,
): StageListeners {
  // Both events carry the change that was actually applied once they
  // have been resolved — a stage that was already at the floor comes
  // back as nothing moved — so a negative is a stat that really did go
  // down, whichever door it came through
  const fell = (event: UnitUpdateStageEvent): void => {
    if (event.value < 0) {
      listener(event.source, event.stage, event.cause);
    }
  };

  return [
    battle.on(BattleEvents.UnitRemoveStage, EventPriority.Post, fell),
    battle.on(BattleEvents.UnitAddStage, EventPriority.Post, fell),
  ];
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
