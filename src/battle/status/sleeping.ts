import { EventPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, EffectType } from '../events';
import turns from '../turn';
import createTimedStatus from './__create';

// One to three turns in the mainline, taken at its middle
const DURATION = turns(2);

const setupTimer = createTimedStatus(Statuses.Sleeping, DURATION);

/**
 * The two moves a sleeper can still cast: one is the noise it makes
 * asleep, the other is what it mutters while it does
 */
const ASLEEP_ONLY = new Set<Moves>([Moves.Snore, Moves.SleepTalk]);

export default function setupSleepingStatus(battle: Battle): void {
  setupTimer(battle);

  battle.on(BattleEvents.CheckUnitCanCast, EventPriority.Post, (event) => {
    if (event.success && event.source.status[Statuses.Sleeping] && !ASLEEP_ONLY.has(event.move)) {
      event.success = false;

      event.source.triggerStatus(Statuses.Sleeping, {
        type: EffectType.None,
      });
    }
  });

  battle.on(BattleEvents.UnitAddStatus, EventPriority.Post, (event) => {
    if (event.status === Statuses.Sleeping) {
      event.source.interrupt();
    }
  });

  battle.on(BattleEvents.UnitCure, EventPriority.Post, (event) => {
    event.source.removeStatus(Statuses.Sleeping, event.cause);
  });
}
