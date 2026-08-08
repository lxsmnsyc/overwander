import { EventPriority } from '../../core/event-emitter';
import type Battle from '../core';
import { BattleEvents } from '../events';

export default function setupTeamMechanics(battle: Battle): void {
  battle.on(BattleEvents.TeamAddUnit, EventPriority.Exact, (event) => {
    event.team.units.add(event.unit);
  });
  battle.on(BattleEvents.TeamRemoveUnit, EventPriority.Exact, (event) => {
    event.team.units.add(event.unit);
  });
  battle.on(BattleEvents.TeamAddStatus, EventPriority.Exact, (event) => {
    event.team.status[event.status] = event.cause;
  });
  battle.on(BattleEvents.TeamRemoveStatus, EventPriority.Exact, (event) => {
    event.team.status[event.status] = undefined;
  });
}
