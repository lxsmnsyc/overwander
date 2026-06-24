import { EventPriority } from '../../core/event-emitter';
import {
  BATTLE_END_EVENT,
  BATTLE_INIT_EVENT,
  BATTLE_START_EVENT,
} from '../events';

const FPS = 60;
const FPS_DURATION = 1000 / FPS;

export function initBattleMechanics() {
  let raf: number;

  BATTLE_INIT_EVENT.on(EventPriority.Exact, () => {
    /**
     * Setup timer
     */
    let elapsed = Date.now();
    raf = requestAnimationFrame(update);

    function update() {
      raf = requestAnimationFrame(update);
      const current = Date.now();
      let diff = current - elapsed;
      elapsed = current;

      while (diff >= FPS_DURATION) {
        // round.tick(FPS_DURATION);
        diff -= FPS_DURATION;
      }

      if (diff > 0) {
        elapsed -= diff;
      }
    }
  });

  BATTLE_START_EVENT.on(EventPriority.Exact, () => {
    // TODO
  });

  BATTLE_END_EVENT.on(EventPriority.Exact, () => {
    if (raf != null) {
      cancelAnimationFrame(raf);
    }
  });
}
