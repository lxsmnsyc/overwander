import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { MoveFlags, Moves } from '../../data/ids/moves';
import { getMoveData } from '../../data/moves';
import type Battle from '../core';
import { BattleEvents, MoveTargetType } from '../events';
import turns from '../turn';
import type Unit from '../unit';

/**
 * Throat Chop: whatever it hits cannot use a sound move for 2 turns
 * https://bulbapedia.bulbagarden.net/wiki/Throat_Chop_(move)
 */
export const THROAT_CHOP_DURATION = turns(2);

function isSound(move: Moves): boolean {
  return (getMoveData(move).flags & MoveFlags.Sound) !== 0;
}

export default function setupThroatChop(battle: Battle): void {
  const chopped = new Map<Unit, number>();

  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Post, (event) => {
    if (event.move === Moves.ThroatChop && event.target.type === MoveTargetType.Unit) {
      chopped.set(event.target.unit, THROAT_CHOP_DURATION);
    }
  });

  battle.on(BattleEvents.CheckUnitCanCast, EventPriority.Post, (event) => {
    if (event.success && chopped.has(event.source) && isSound(event.move)) {
      event.success = false;
    }
  });

  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (event.usable && chopped.has(event.source) && isSound(event.move)) {
      event.usable = false;
    }
  });

  battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
    for (const [unit, left] of chopped) {
      if (left > event.duration) {
        chopped.set(unit, left - event.duration);
      } else {
        chopped.delete(unit);
      }
    }
  });

  for (const gone of [BattleEvents.UnitFaints, BattleEvents.UnitLeavesField] as const) {
    battle.on(gone, EventPriority.Post, (event) => {
      chopped.delete(event.source);
    });
  }
}
