import { EventPriority } from '../../core/event-emitter';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, EffectType } from '../events';
import turns from '../turn';
import type Unit from '../unit';

/** How long the yawn takes to catch up with whoever heard it */
const DELAY = turns(2);

/**
 * Drowsy: sleep arriving late. The yawn lands nothing at the time and
 * everything when it runs out, so a pokemon has the window to swap
 * out or be woken up before it goes under.
 *
 * The countdown is the module's own rather than the shared status
 * timer, because what happens at the end is the point: a drowsiness
 * that is taken off early has to leave the pokemon awake
 * https://bulbapedia.bulbagarden.net/wiki/Yawn_(move)
 */
export default function setupDrowsyStatus(battle: Battle): void {
  const pending = new Map<Unit, number>();

  const timer = battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
    for (const [unit, left] of [...pending]) {
      const remaining = left - event.duration;

      if (remaining > 0) {
        pending.set(unit, remaining);
        continue;
      }

      pending.delete(unit);

      const cause = unit.status[Statuses.Drowsy] ?? { type: EffectType.None };

      unit.removeStatus(Statuses.Drowsy, cause);

      if (unit.alive) {
        unit.addStatus(Statuses.Sleeping, cause);
      }
    }

    if (pending.size === 0) {
      timer.stop();
    }
  });

  timer.stop();

  battle.on(BattleEvents.UnitAddStatus, EventPriority.Post, (event) => {
    if (event.status === Statuses.Drowsy) {
      pending.set(event.source, DELAY);
      timer.start();
    }
  });

  // Taken off before it lands is a yawn slept through rather than one
  // that worked
  battle.on(BattleEvents.UnitRemoveStatus, EventPriority.Post, (event) => {
    if (event.status === Statuses.Drowsy) {
      pending.delete(event.source);
    }
  });

  // Nothing already asleep can be made drowsy on top of it
  battle.on(BattleEvents.CheckUnitStatusImmunity, EventPriority.Exact, (event) => {
    if (
      !event.immune &&
      event.status === Statuses.Drowsy &&
      event.source.status[Statuses.Sleeping] != null
    ) {
      event.immune = true;
    }
  });
}
