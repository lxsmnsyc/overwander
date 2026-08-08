import type Battle from './core';
import { BattleEvents } from './events';
import type Team from './team';

export default class Alliance {
  teams = new Set<Team>();

  constructor(public battle: Battle) {
    this.battle.addAlliance(this);
  }

  addTeam(team: Team): void {
    this.battle.emit(BattleEvents.AllianceAddTeam, {
      id: 'AllianceAddTeam',
      disabled: false,
      alliance: this,
      team,
    });
  }

  removeTeam(team: Team): void {
    this.battle.emit(BattleEvents.AllianceAddTeam, {
      id: 'AllianceRemoveTeam',
      disabled: false,
      alliance: this,
      team,
    });
  }
}
