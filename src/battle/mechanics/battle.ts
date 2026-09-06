import { EventPriority } from '../../core/event-emitter';
import type Battle from '../core';
import { BattleEvents } from '../events';

const FPS = 60;
const FPS_DURATION = 1000 / FPS;

/**
 * The most real time one frame may hand to the fight.
 *
 * A frame that stalls arrives carrying everything since the last one:
 * a tab painting again, a slow load, a machine waking up. Fed to the
 * engine whole, that is minutes of fighting played out in a single
 * frame with nobody at the controls, and the player comes back to a
 * battle already lost. A quarter of a second is more than any real
 * frame and less than anything worth replaying
 */
const MAX_FRAME = 250;

/**
 * Whether the page is in front of the player.
 *
 * A real-time fight nobody can see is a fight nobody can answer, so it
 * holds where it is rather than being played out by the AI alone. Both
 * halves count: a hidden tab is not painted at all, and a visible one
 * behind another window is still a fight the player is not watching
 */
function watched(): boolean {
  if (typeof document === 'undefined') {
    return true;
  }
  return document.visibilityState !== 'hidden' && document.hasFocus();
}

export default function setupBattleMechanics(battle: Battle): void {
  let raf: number | undefined;
  /** When the last frame the fight actually saw was */
  let elapsed = 0;
  /** Whether the fight is holding because nobody is watching it */
  let held = false;

  const hold = (): void => {
    held = true;
  };

  /**
   * Pick the fight back up. The time away is not owed to it: the
   * clock starts again from now rather than replaying what was missed
   */
  const check = (): void => {
    if (!watched()) {
      held = true;
      return;
    }
    elapsed = Date.now();
    held = false;
  };

  const listen = (watching: boolean): void => {
    if (typeof document === 'undefined') {
      return;
    }
    const bind = watching ? 'addEventListener' : 'removeEventListener';

    document[bind]('visibilitychange', check);
    globalThis[bind]('blur', hold);
    globalThis[bind]('focus', check);
  };

  battle.on(BattleEvents.Start, EventPriority.Exact, () => {
    elapsed = Date.now();
    held = !watched();
    listen(true);
    raf = requestAnimationFrame(update);

    function update(): void {
      raf = requestAnimationFrame(update);
      if (held) {
        return;
      }

      const current = Date.now();
      // Never more than a moment, however long the frame took
      let diff = Math.min(current - elapsed, MAX_FRAME);

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
    listen(false);
  });
}
