import { EventPriority } from '../../core/event-emitter';
import { Types } from '../../data/constants/types';
import { Statuses } from '../../data/ids/status';
import type { Battle } from '../core';
import { BattleEvents } from '../events';
import type { Unit } from '../unit';

export function setupParalyzedStatus(battle: Battle) {
  function rollParalyzed(source: Unit) {
    const current = source.status[Statuses.Paralyzed];
    if (current && battle.random() * 100 <= 25) {
      source.triggerStatus(Statuses.Paralyzed, current);
      return true;
    }
    return false;
  }
  battle.on(BattleEvents.CheckUnitCanCast, EventPriority.Post, event => {
    event.success = event.success && !rollParalyzed(event.source);
  });

  battle.on(BattleEvents.CheckUnitCanChannel, EventPriority.Post, event => {
    event.success = event.success && !rollParalyzed(event.source);
  });

  // Electric types are naturally immune to paralysis
  battle.on(BattleEvents.CheckUnitStatusImmunity, EventPriority.Post, event => {
    event.immune =
      !event.immune &&
      event.status === Statuses.Paralyzed &&
      event.source.types.has(Types.Electric);
  });
}
