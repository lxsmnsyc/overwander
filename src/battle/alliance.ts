import type Battle from './core';
import { BattleEvents } from './events';
import type Team from './team';

export default class Alliance {
  teams = new Set<Team>();

  /**
   * Whether this side is the raid boss rather than a party of
   * players. A raid is meant to be beatable: when a raid ends with
   * nobody standing, the victory goes to the side that is not this
   * one
   */
  constructor(
    public battle: Battle,
    public readonly boss = false,
  ) {
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
