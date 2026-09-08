import { EventPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import type Battle from '../core';
import { BattleEvents } from '../events';

const INCREASED_CRITICAL_HIT_RATIO_MOVES = new Set([
  Moves.RazorLeaf,
  Moves.Slash,
  Moves.RazorWind,
  Moves.SkyAttack,
  Moves.KarateChop,
  Moves.Crabhammer,
  Moves.Aeroblast,
  Moves.CrossChop,
  Moves.BlazeKick,
  Moves.AirCutter,
  Moves.PoisonTail,
  Moves.LeafBlade,
]);

export default function setupIncreasedCriticalHitRatioMoves(battle: Battle): void {
  battle.on(BattleEvents.UnitAttackCheckCriticalRatio, EventPriority.Post, (event) => {
    if (INCREASED_CRITICAL_HIT_RATIO_MOVES.has(event.parent.move)) {
      // Additive so it stacks with Focus Energy and similar boosts
      event.value += 1;
    }
  });
}
