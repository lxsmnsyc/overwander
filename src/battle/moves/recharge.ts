import { AttackPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import { STEP_PENALTY } from '../ai/score';
import type Battle from '../core';
import { BattleEvents, EffectType } from '../events';

// https://bulbapedia.bulbagarden.net/wiki/Hyper_Beam_(move)
// Moves that lock the user into a recharge after a successful hit.
const RECHARGE_MOVES = new Set<Moves>([
  Moves.HyperBeam,
  Moves.BlastBurn,
  Moves.HydroCannon,
  Moves.FrenzyPlant,
]);

export default function setupRechargeMoves(battle: Battle): void {
  /**
   * UnitTriggerMoveEffect only fires when the move connects (a miss emits
   * UnitTriggerMoveMissed, an immunity emits UnitTriggerMoveFailed), which
   * matches the modern behavior: no recharge on a miss or failure, but the
   * user always recharges on a hit, even if the target faints.
   *
   * Post priority so the damage handlers at Exact resolve first.
   */
  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Post, (event) => {
    if (RECHARGE_MOVES.has(event.move) && event.steps === 0) {
      event.source.addStatus(Statuses.Recharging, {
        type: EffectType.Move,
        move: event.move,
        unit: event.source,
      });
    }
  });

  // The recharge is a cast spent standing still, the same cost as a
  // move that has to wind up first
  battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    if (RECHARGE_MOVES.has(event.move)) {
      event.score -= STEP_PENALTY;
    }
  });
}
