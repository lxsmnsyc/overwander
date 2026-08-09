import { EventPriority } from '../../core/event-emitter';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, EffectType } from '../events';
import createTimedStatus from './__create';

// Real-time equivalent of losing the turn
const DURATION = 500;

const setupTimer = createTimedStatus(Statuses.Flinched, DURATION);

export default function setupFlinchedStatus(battle: Battle): void {
  setupTimer(battle);

  battle.on(BattleEvents.CheckUnitCanCast, EventPriority.Post, (event) => {
    if (event.success && event.source.status[Statuses.Flinched]) {
      event.success = false;

      event.source.triggerStatus(Statuses.Flinched, {
        type: EffectType.None,
      });
    }
  });

  battle.on(BattleEvents.UnitAddStatus, EventPriority.Post, (event) => {
    if (event.status === Statuses.Flinched) {
      event.source.interrupt();
    }
  });
}
