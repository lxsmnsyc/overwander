import type { Battle } from './core';
import { BattleEvents } from './events';
import type { Team } from './team';

export class Alliance {
  teams = new Set<Team>();

  constructor(public battle: Battle) {
    this.battle.addAlliance(this);
  }

  addTeam(team: Team) {
    this.battle.emit(BattleEvents.AllianceAddTeam, {
      id: 'AllianceAddTeam',
      disabled: false,
      alliance: this,
      team,
    });
  }

  removeTeam(team: Team) {
    this.battle.emit(BattleEvents.AllianceAddTeam, {
      id: 'AllianceRemoveTeam',
      disabled: false,
      alliance: this,
      team,
    });
  }
}
