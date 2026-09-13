import { EventPriority } from '../../core/event-emitter';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents } from '../events';

/**
 * SkyDropped: the unit is being carried by a Sky Drop and can do
 * nothing until it is set down. There is no clock on it: the move
 * that picked it up is what puts it down
 */
export default function setupSkyDroppedStatus(battle: Battle): void {
  battle.on(BattleEvents.CheckUnitCanCast, EventPriority.Post, (event) => {
    if (event.success && event.source.status[Statuses.SkyDropped] != null) {
      event.success = false;
    }
  });

  battle.on(BattleEvents.CheckUnitCanChannel, EventPriority.Post, (event) => {
    if (event.success && event.source.status[Statuses.SkyDropped] != null) {
      event.success = false;
    }
  });

  battle.on(BattleEvents.UnitAddStatus, EventPriority.Post, (event) => {
    if (event.status === Statuses.SkyDropped) {
      event.source.interrupt();
    }
  });
}
