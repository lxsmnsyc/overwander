import { EventPriority } from '../../core/event-emitter';
import type { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, type ProgressData } from '../events';
import { TURN } from '../turn';
import type Unit from '../unit';

/**
 * How often a status that chips away does it: once a turn, since what
 * the mainline takes a fraction of a turn takes a fraction of one
 * here. Shared rather than repeated, because four statuses ticking at
 * four subtly different rates is four balance decisions nobody made
 */
export const RESIDUAL_TICK = TURN;

/**
 * Wires a status to a countdown timer, structured like the casting
 * mechanics: progression flows through UnitUpdateStatusTimer events
 * every tick (so visual cues can render progress), the event is
 * authoritative (applied on Exact, external code can fast-forward
 * it), and the status removes itself on completion.
 *
 * The base duration resolves through CheckUnitStatusDuration when
 * the status lands, so abilities like Early Bird can adjust it per
 * unit. The shared Tick listener is lazy: it only runs while at
 * least one instance is pending.
 */
export default function createTimedStatus(status: Statuses, duration: number) {
  return (battle: Battle): void => {
    const instances = new Map<Unit, ProgressData>();

    const timer = battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
      // Snapshot: completions mutate the map mid-walk
      for (const [unit, time] of [...instances]) {
        unit.updateStatusTimer(status, {
          progress: time.progress + event.duration,
        });
      }
    });

    timer.stop();

    // The progression event is authoritative, like UnitUpdateCast
    battle.on(BattleEvents.UnitUpdateStatusTimer, EventPriority.Exact, (event) => {
      if (event.status !== status) {
        return;
      }

      const time = instances.get(event.source);

      if (time) {
        const next = { ...time, ...event.data };
        instances.set(event.source, next);

        if (next.progress >= next.duration) {
          // The unit's status record holds the original cause
          const cause = event.source.status[status];

          if (cause) {
            event.source.removeStatus(status, cause);
          }
        }
      }
    });

    battle.on(BattleEvents.UnitAddStatus, EventPriority.Post, (event) => {
      if (event.status === status) {
        instances.set(event.source, {
          progress: 0,
          // Resolved through the event engine (e.g. Early Bird)
          duration: event.source.checkStatusDuration(status, duration, event.cause),
        });

        timer.start();
      }
    });

    battle.on(BattleEvents.UnitRemoveStatus, EventPriority.Post, (event) => {
      if (event.status === status) {
        instances.delete(event.source);

        if (instances.size === 0) {
          timer.stop();
        }
      }
    });
  };
}
