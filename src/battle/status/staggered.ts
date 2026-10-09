import { EventPriority } from '../../core/event-emitter';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, EffectType } from '../events';
import turns from '../turn';
import createTimedStatus from './__create';

/**
 * How long a staggered Noble reels: two turns, the opening a party
 * earns by draining a quarter of its Frenzy
 */
export const STAGGER_DURATION = turns(2);

const setupTimer = createTimedStatus(Statuses.Staggered, STAGGER_DURATION);

export default function setupStaggeredStatus(battle: Battle): void {
  setupTimer(battle);

  battle.on(BattleEvents.CheckUnitCanCast, EventPriority.Post, (event) => {
    if (event.success && event.source.status[Statuses.Staggered]) {
      event.success = false;

      event.source.triggerStatus(Statuses.Staggered, { type: EffectType.None });
    }
  });

  // Whatever it was winding up is lost. A stop rather than an
  // interrupt, since a boss refuses every interrupt short of fainting
  battle.on(BattleEvents.UnitAddStatus, EventPriority.Post, (event) => {
    if (event.status === Statuses.Staggered) {
      event.source.stopCast();
      event.source.stopChannel();
    }
  });
}
