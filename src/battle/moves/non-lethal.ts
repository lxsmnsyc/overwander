import { AttackPriority } from '../../core/event-emitter';
import { DamageFlags, Moves } from '../../data/ids/moves';
import type Battle from '../core';
import { BattleEvents, EffectType } from '../events';

/**
 * The moves that will not finish anything off. False Swipe is the
 * catcher's move: it takes a target down to its last point of health
 * and no further
 */
const NON_LETHAL_MOVES = new Set<Moves>([Moves.FalseSwipe]);

export default function setupNonLethalMoves(battle: Battle): void {
  battle.on(BattleEvents.UnitDamage, AttackPriority.Pre, (event) => {
    if (event.cause.type === EffectType.Move && NON_LETHAL_MOVES.has(event.cause.move)) {
      event.flags |= DamageFlags.NonLethal;
    }
  });
}
