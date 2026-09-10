import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import { isBerry } from '../../data/items/berries';
import type Battle from '../core';
import { BattleEvents, EffectType } from '../events';
import { stealableItem } from '../utils';

/**
 * Fling throws whatever the user is holding, and the item is gone
 * after.
 *
 * The mainline gives every item its own thrown power out of a table
 * of a hundred entries. That table is the main games' history rather
 * than a rule, so this weighs the throw the way this engine already
 * sorts items: a berry is a soft thing to throw and everything else
 * is a hard one
 * https://bulbapedia.bulbagarden.net/wiki/Fling_(move)
 */
const SOFT_POWER = 10;

const HARD_POWER = 60;

export default function setupFling(battle: Battle): void {
  // Nothing in hand is nothing to throw
  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (event.usable && event.move === Moves.Fling) {
      event.usable = stealableItem(event.source) != null;
    }
  });

  battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Exact, (event) => {
    if (event.move !== Moves.Fling) {
      return;
    }

    const held = stealableItem(event.source);

    if (held == null) {
      event.power = 1;
      return;
    }
    event.power = isBerry(held) ? SOFT_POWER : HARD_POWER;
  });

  // Thrown as it lands, so a throw that was turned away still costs
  // the item: it has left the user's hand either way
  battle.on(BattleEvents.UnitAttackEffect, EventPriority.Exact, (event) => {
    if (event.parent.move !== Moves.Fling) {
      return;
    }

    const source = event.parent.source;
    const held = stealableItem(source);

    if (held != null) {
      source.removeItem(held, { type: EffectType.Move, move: Moves.Fling, unit: source });
    }
  });

  battle.on(BattleEvents.CheckUnitAttackEffectChance, EventPriority.Post, (event) => {
    if (event.parent.move === Moves.Fling) {
      event.value = 100;
    }
  });
}
