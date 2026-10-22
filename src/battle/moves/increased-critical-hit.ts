import { EventPriority } from '../../core/event-emitter';
import { MoveFlags } from '../../data/ids/moves';
import { getMoveData } from '../../data/moves';
import type Battle from '../battle';
import { BattleEvents } from '../events';

export default function setupIncreasedCriticalHitRatioMoves(battle: Battle): void {
  battle.on(BattleEvents.UnitAttackCheckCriticalRatio, EventPriority.Post, (event) => {
    if ((getMoveData(event.parent.move).flags & MoveFlags.HighCrit) !== 0) {
      // Additive so it stacks with Focus Energy and similar boosts
      event.value += 1;
    }
  });
}
