import { EventPriority } from '../../core/event-emitter';
import { MoveFlags } from '../../data/ids/moves';
import { hasMoveFlag } from '../../data/moves';
import type Battle from '../battle';
import { BattleEvents } from '../events';

export default function setupIncreasedCriticalHitRatioMoves(battle: Battle): void {
  battle.on(BattleEvents.UnitAttackCheckCriticalRatio, EventPriority.Post, (event) => {
    if (hasMoveFlag(event.parent.move, MoveFlags.HighCrit)) {
      // Additive so it stacks with Focus Energy and similar boosts
      event.value += 1;
    }
  });
}
