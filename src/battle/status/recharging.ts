import { EventPriority } from '../../core/event-emitter';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, EffectType } from '../events';
import turns from '../turn';
import createTimedStatus from './__create';

// Real-time equivalent of the single recharge turn
// Hyper Beam costs its user the turn after it
const DURATION = turns(1);

const setupTimer = createTimedStatus(Statuses.Recharging, DURATION);

export default function setupRechargingStatus(battle: Battle): void {
  setupTimer(battle);

  battle.on(BattleEvents.CheckUnitCanCast, EventPriority.Post, (event) => {
    if (event.success && event.source.status[Statuses.Recharging]) {
      event.success = false;

      event.source.triggerStatus(Statuses.Recharging, {
        type: EffectType.None,
      });
    }
  });

  // No UnitCure hook: recharging is a move lock, not a status condition,
  // so heals/cures (e.g. Rest, Heal Bell) do not clear it.
}
