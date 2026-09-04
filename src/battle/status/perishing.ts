import { EventPriority } from '../../core/event-emitter';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, type EffectCause } from '../events';
import turns from '../turn';
import type Unit from '../unit';

/**
 * The mainline counts three turns down and the third one is fatal.
 * A turn longer here, because a real-time count cannot be spent
 * setting up the way a turn-based one can: the extra turn is the room
 * to actually use it
 */
export const PERISH_DURATION = turns(4);

interface PerishData {
  progress: number;
  cause: EffectCause;
}

/**
 * The count a Perish Song starts. It runs on the clock rather than on
 * what the unit does, so standing still is no way out: leaving the
 * field is https://bulbapedia.bulbagarden.net/wiki/Perish_Song_(move)
 */
export default function setupPerishingStatus(battle: Battle): void {
  const instances = new Map<Unit, PerishData>();

  const timer = battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
    for (const [unit, data] of [...instances]) {
      data.progress += event.duration;

      if (data.progress >= PERISH_DURATION) {
        instances.delete(unit);
        unit.removeStatus(Statuses.Perishing, data.cause);

        if (unit.alive) {
          unit.faint(unit);
        }
      }
    }

    if (instances.size === 0) {
      timer.stop();
    }
  });

  timer.stop();

  battle.on(BattleEvents.UnitAddStatus, EventPriority.Post, (event) => {
    if (event.status === Statuses.Perishing && !instances.has(event.source)) {
      instances.set(event.source, { progress: 0, cause: event.cause });
      timer.start();
    }
  });

  battle.on(BattleEvents.UnitRemoveStatus, EventPriority.Post, (event) => {
    if (event.status === Statuses.Perishing) {
      instances.delete(event.source);

      if (instances.size === 0) {
        timer.stop();
      }
    }
  });

  // Walking off the field is the way out of it
  battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
    const cause = event.source.status[Statuses.Perishing];

    if (cause != null) {
      event.source.removeStatus(Statuses.Perishing, cause);
    }
  });
}
