import { EventPriority } from '../../core/event-emitter';
import type Battle from '../core';
import { BattleEvents } from '../events';

const FPS = 60;
const FPS_DURATION = 1000 / FPS;

export default function setupBattleMechanics(battle: Battle): void {
  let raf: number | undefined;

  battle.on(BattleEvents.Start, EventPriority.Exact, () => {
    /**
     * Setup timer
     */
    let elapsed = Date.now();
    raf = requestAnimationFrame(update);

    function update(): void {
      raf = requestAnimationFrame(update);
      const current = Date.now();
      let diff = current - elapsed;
      elapsed = current;

      while (diff >= FPS_DURATION) {
        battle.tick(FPS_DURATION);
        diff -= FPS_DURATION;
      }

      if (diff > 0) {
        elapsed -= diff;
      }
    }
  });

  battle.on(BattleEvents.End, EventPriority.Exact, () => {
    if (raf != null) {
      cancelAnimationFrame(raf);
    }
  });
}
