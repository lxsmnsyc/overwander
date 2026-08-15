import { EventPriority } from '../../core/event-emitter';
import type { Stages } from '../../data/constants/stats';
import { Items } from '../../data/ids/items';
import { X_ITEM_STAGES } from '../../data/items/battle-items';
import type Battle from '../core';
import { BattleEvents, type CheckUnitCanUpdateStageEvent, EffectType } from '../events';
import { type Lifecycle, MergedLifecycle } from '../lifecycle';
import type Unit from '../unit';
import { createHeldItem, holds, lowering, spendItem } from './__create';

/**
 * The battle items, carried rather than thrown in from the side.
 *
 * Each answers a stat being knocked down, which is the moment a
 * trainer would have reached for one. That makes them the mirror of
 * the White Herb: the herb puts back exactly what was taken, and these
 * pay for the trouble — an X item hands back more than the drop cost,
 * and a Dire Hit answers a weakened pokemon by sharpening it instead.
 */

/**
 * What an X item puts up when its stat is knocked down. Two, so a
 * single drop answered leaves the holder ahead: an item spent
 * breaking even is an item nobody carries
 */
export const X_ITEM_STAGES_BOOST = 2;

/**
 * What a Dire Hit is worth, in critical stages — the doubling a Scope
 * Lens buys, twice over, since it is spent to get it
 */
export const DIRE_HIT_CRITICAL_STAGES = 2;

/**
 * An X item waits for its own stat and nobody else's, then puts it
 * back up further than it fell
 */
function setupXItem(item: Items, stage: Stages): (battle: Battle) => void {
  return createHeldItem(
    item,
    (battle) =>
      new MergedLifecycle(
        lowering(battle, (unit, fell) => {
          if (fell !== stage) {
            return;
          }

          const cause = spendItem(unit, item);

          if (cause) {
            unit.addStage(stage, X_ITEM_STAGES_BOOST, cause);
          }
        }),
      ),
  );
}

/**
 * A Dire Hit answers any stat going down by making its holder likelier
 * to land a critical, and what it buys outlives it — so it refuses to
 * be switched off while anybody is still sharpened, even with no Dire
 * Hit left on the field
 */
const setupDireHit = createHeldItem(Items.DireHit, (battle): Lifecycle => {
  const sharpened = new Set<Unit>();

  const listening = new MergedLifecycle([
    ...lowering(battle, (unit) => {
      if (!holds(unit, Items.DireHit)) {
        return;
      }

      // Marked before it is spent, not after: spending it is what
      // closes its own gate, and the gate asks whether anybody is
      // still sharpened
      sharpened.add(unit);

      if (!spendItem(unit, Items.DireHit)) {
        sharpened.delete(unit);
      }
    }),

    battle.on(BattleEvents.UnitAttackCheckCriticalRatio, EventPriority.Post, (event) => {
      if (sharpened.has(event.parent.source)) {
        event.value += DIRE_HIT_CRITICAL_STAGES;
      }
    }),

    // Nothing carries off the field: a unit that has left is not the
    // one that comes back
    battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
      sharpened.delete(event.source);
    }),
  ]);

  return {
    start: () => {
      listening.start();
    },
    stop: () => {
      if (sharpened.size === 0) {
        listening.stop();
      }
    },
  };
});

/**
 * A Guard Spec refuses the drop rather than answering it, which is why
 * it rides the can-change verdict rather than the lowered-stage event:
 * by the time a stage has fallen there is nothing left to guard. It is
 * spent on the first drop somebody else tries, and does nothing about
 * what its holder does to itself
 */
const setupGuardSpec = createHeldItem(Items.GuardSpec, (battle) => {
  /**
   * A drop is a negative on the add check and a positive on the remove
   * one, which is the same difference the lowered-stage pair reads
   */
  function refuse(event: CheckUnitCanUpdateStageEvent, lowered: boolean): void {
    if (
      !event.success ||
      !lowered ||
      event.cause.type === EffectType.None ||
      event.cause.unit === event.source ||
      !holds(event.source, Items.GuardSpec)
    ) {
      return;
    }
    if (spendItem(event.source, Items.GuardSpec)) {
      event.success = false;
    }
  }

  return new MergedLifecycle([
    battle.on(BattleEvents.CheckUnitCanAddStage, EventPriority.Post, (event) => {
      refuse(event, event.value < 0);
    }),
    battle.on(BattleEvents.CheckUnitCanRemoveStage, EventPriority.Post, (event) => {
      refuse(event, event.value > 0);
    }),
  ]);
});

const SETUPS: ((battle: Battle) => void)[] = [
  ...[...X_ITEM_STAGES].map(([item, stage]) => setupXItem(item, stage)),
  setupDireHit,
  setupGuardSpec,
];

export default function setupBattleItems(battle: Battle): void {
  for (const setup of SETUPS) {
    setup(battle);
  }
}
