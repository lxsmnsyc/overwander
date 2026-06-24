import { EventPriority } from '../../core/event-emitter';
import type { Battle } from '../core';
import { BattleEvents } from '../events';

export function setupAllianceMechanics(battle: Battle) {
  battle.on(BattleEvents.AllianceAddTeam, EventPriority.Exact, event => {
    event.alliance.teams.add(event.team);
  });
  battle.on(BattleEvents.AllianceRemoveTeam, EventPriority.Exact, event => {
    event.alliance.teams.delete(event.team);
  });
}
