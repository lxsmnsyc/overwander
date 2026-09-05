import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Items } from '../../../data/ids/items';
import { MoveCategories } from '../../../data/ids/moves';
import { Statuses } from '../../../data/ids/status';
import type Battle from '../../core';
import { BattleEvents, type CheckUnitCanUpdateStageEvent, EffectType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import { createHeldItem, holds } from '../__create';
import { KINGS_ROCK_CHANCE, RAZOR_CLAW_CRITICAL_STAGES } from './worths';

/** The gear that shakes a target loose, and the amulet that refuses to be shaken */
/**
 * A King's Rock or a Razor Fang makes whatever its holder throws
 * liable to leave the target reeling. It rides the attack rather than
 * the move, so it is a chance on every blow that lands rather than on
 * one particular kind of blow — and a move that already flinches does
 * not get a second roll
 */
export function setupFlinchItem(item: Items): (battle: Battle) => void {
  return createHeldItem(item, (battle) =>
    battle.on(BattleEvents.UnitAttack, AttackPriority.Cleanup, (event) => {
      if (
        !event.success ||
        event.category === MoveCategories.Status ||
        !event.target.alive ||
        event.target.status[Statuses.Flinched] != null ||
        !holds(event.source, item) ||
        battle.random() >= KINGS_ROCK_CHANCE
      ) {
        return;
      }

      event.source.triggerItem(item);
      event.target.addStatus(Statuses.Flinched, {
        type: EffectType.Item,
        item,
        unit: event.source,
      });
    }),
  );
}

/**
 * A Razor Claw sharpens its holder the way a Scope Lens does. It is
 * the other half of what the claw is for, and works whether or not the
 * evolution it gates is reachable
 */
export const setupRazorClaw = createHeldItem(Items.RazorClaw, (battle) =>
  battle.on(BattleEvents.UnitAttackCheckCriticalRatio, EventPriority.Post, (event) => {
    if (holds(event.parent.source, Items.RazorClaw)) {
      event.value += RAZOR_CLAW_CRITICAL_STAGES;
    }
  }),
);

/**
 * A Clear Amulet is a Guard Spec nobody has to spend: it refuses every
 * stat drop somebody else tries, for as long as it is carried, and
 * says nothing about what its holder does to itself
 */
export const setupClearAmulet = createHeldItem(Items.ClearAmulet, (battle) => {
  function refuse(event: CheckUnitCanUpdateStageEvent, lowered: boolean): void {
    if (
      event.success &&
      lowered &&
      event.cause.type !== EffectType.None &&
      event.cause.unit !== event.source &&
      holds(event.source, Items.ClearAmulet)
    ) {
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
