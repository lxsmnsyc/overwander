import { EventPriority } from '../../core/event-emitter';
import type { Items } from '../../data/ids/items';
import { Moves } from '../../data/ids/moves';
import type Battle from '../core';
import { BattleEvents, EffectType } from '../events';
import type Unit from '../unit';

/**
 * What the target is carrying, if it is carrying one thing a thief
 * could walk off with. Nothing when its hands are empty
 */
function stealable(target: Unit): Items | undefined {
  for (const [item, carried] of Object.entries(target.items)) {
    if (carried) {
      // The bag is keyed by the item enum, which comes back as a
      // string from Object.entries
      // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
      return Number(item) as Items;
    }
  }
  return undefined;
}

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
    const item = stealable(target);

    if (item == null || stealable(source) != null || !source.alive) {
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
