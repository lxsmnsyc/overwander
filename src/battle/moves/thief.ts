import { EventPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import type Battle from '../core';
import { BattleEvents, EffectType } from '../events';
import { stealableItem } from '../utils';

/**
 * Thief and Covet take what the target is holding, and only into a
 * free hand: a unit already carrying something steals nothing. The
 * two differ in the main games only in flavour, so they differ in
 * nothing here
 * https://bulbapedia.bulbagarden.net/wiki/Thief_(move)
 */
const THIEVING_MOVES = new Set<Moves>([Moves.Thief, Moves.Covet]);

export default function setupThief(battle: Battle): void {
  battle.on(BattleEvents.UnitAttackEffect, EventPriority.Exact, (event) => {
    if (!THIEVING_MOVES.has(event.parent.move)) {
      return;
    }

    const source = event.parent.source;
    const target = event.parent.target;
    const item = stealableItem(target);

    if (item == null || stealableItem(source) != null || !source.alive) {
      return;
    }

    target.removeItem(item, { type: EffectType.Move, move: event.parent.move, unit: source });
    source.addItem(item);
  });

  // The theft is a secondary effect, and secondary effects only fire
  // when something says how often: this one always does
  battle.on(BattleEvents.CheckUnitAttackEffectChance, EventPriority.Post, (event) => {
    if (THIEVING_MOVES.has(event.parent.move)) {
      event.value = 100;
    }
  });
}
