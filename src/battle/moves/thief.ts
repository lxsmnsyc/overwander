import { EventPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import type Battle from '../core';
import { BattleEvents, EffectType } from '../events';
import { stealableItem } from '../utils';

/**
 * Thief takes what the target is holding, and only into a free hand:
 * a unit already carrying something steals nothing
 * https://bulbapedia.bulbagarden.net/wiki/Thief_(move)
 */
export default function setupThief(battle: Battle): void {
  battle.on(BattleEvents.UnitAttackEffect, EventPriority.Exact, (event) => {
    if (event.parent.move !== Moves.Thief) {
      return;
    }

    const source = event.parent.source;
    const target = event.parent.target;
    const item = stealableItem(target);

    if (item == null || stealableItem(source) != null || !source.alive) {
      return;
    }

    target.removeItem(item, { type: EffectType.Move, move: Moves.Thief, unit: source });
    source.addItem(item);
  });

  // The theft is a secondary effect, and secondary effects only fire
  // when something says how often: this one always does
  battle.on(BattleEvents.CheckUnitAttackEffectChance, EventPriority.Post, (event) => {
    if (event.parent.move === Moves.Thief) {
      event.value = 100;
    }
  });
}
