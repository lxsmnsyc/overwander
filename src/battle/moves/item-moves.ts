import { AttackPriority, EventPriority } from '../../core/event-emitter';
import type { Items } from '../../data/ids/items';
import { Moves } from '../../data/ids/moves';
import { USELESS_PENALTY } from '../ai/score';
import type Battle from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';
import type Unit from '../unit';
import { hasFreeItemSlot, stealableItem } from '../utils';

/**
 * The moves that move held items about rather than damage: one knocks
 * an item out of the target's hands, one swaps hands with it, and one
 * picks back up what the user has already used.
 *
 * Thief and Covet, which take an item for keeps, are the thief group's
 * own business.
 */
export default function setupItemMoves(battle: Battle): void {
  /** What each unit last used up, which is what a Recycle gets back */
  const spent = new Map<Unit, Items>();

  battle.on(BattleEvents.UnitRemoveItem, EventPriority.Post, (event) => {
    // Only what the holder consumed itself: an item knocked out of
    // its hands is gone rather than spent
    if (event.cause.type === EffectType.Item) {
      spent.set(event.source, event.item);
    }
  });

  battle.on(BattleEvents.UnitAttackEffect, EventPriority.Exact, (event) => {
    if (event.parent.move !== Moves.KnockOff) {
      return;
    }

    const item = stealableItem(event.parent.target);

    if (item != null) {
      event.parent.target.removeItem(item, {
        type: EffectType.Move,
        move: Moves.KnockOff,
        unit: event.parent.source,
      });
    }
  });

  battle.on(BattleEvents.CheckUnitAttackEffectChance, EventPriority.Post, (event) => {
    if (event.parent.move === Moves.KnockOff) {
      event.value = 100;
    }
  });

  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    const cause = { type: EffectType.Move, move: event.move, unit: event.source } as const;

    if (event.move === Moves.Recycle) {
      const item = spent.get(event.source);

      if (item == null || !hasFreeItemSlot(event.source)) {
        event.source.triggerMoveEffectFailed(event.move, event.target, event.steps);
        return;
      }

      spent.delete(event.source);
      event.source.addItem(item);
      return;
    }

    if (event.move !== Moves.Trick || event.target.type !== MoveTargetType.Unit) {
      return;
    }

    // A swap needs something to swap: two empty hands is a wasted cast
    const target = event.target.unit;
    const mine = stealableItem(event.source);
    const theirs = stealableItem(target);

    if (mine == null && theirs == null) {
      event.source.triggerMoveEffectFailed(event.move, event.target, event.steps);
      return;
    }

    if (mine != null) {
      event.source.removeItem(mine, cause);
    }
    if (theirs != null) {
      target.removeItem(theirs, cause);
      event.source.addItem(theirs);
    }
    if (mine != null) {
      target.addItem(mine);
    }
  });

  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (event.usable && event.move === Moves.Recycle) {
      event.usable = spent.has(event.source);
    }
  });

  battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    if (
      event.move === Moves.KnockOff &&
      event.target.type === MoveTargetType.Unit &&
      stealableItem(event.target.unit) == null
    ) {
      event.score -= USELESS_PENALTY;
    }
  });

  for (const gone of [BattleEvents.UnitFaints, BattleEvents.UnitLeavesField] as const) {
    battle.on(gone, EventPriority.Post, (event) => {
      spent.delete(event.source);
    });
  }
}
