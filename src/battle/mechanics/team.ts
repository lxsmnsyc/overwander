import { EventPriority } from '../../core/event-emitter';
import type { Battle } from '../core';
import { BattleEvents } from '../events';

export function setupTeamMechanics(battle: Battle) {
  battle.on(BattleEvents.TeamAddUnit, EventPriority.Exact, event => {
    event.team.units.add(event.unit);
  });
  battle.on(BattleEvents.TeamRemoveUnit, EventPriority.Exact, event => {
    event.team.units.add(event.unit);
  });
  battle.on(BattleEvents.TeamAddStatus, EventPriority.Exact, event => {
    event.team.status.add(event.status);
  });
  battle.on(BattleEvents.TeamRemoveStatus, EventPriority.Exact, event => {
    event.team.status.add(event.status);
  });
}
