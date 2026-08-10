import { type TeamStatuses, Weathers } from '../data/ids/status';
import type Alliance from './alliance';
import type Battle from './core';
import { BattleEvents, type CheckTeamStatusImmunityEvent, type EffectCause } from './events';
import type Unit from './unit';

export default class Team {
  units = new Set<Unit>();

  constructor(
    public battle: Battle,
    public alliance: Alliance,
    /**
     * The player whose party this is, empty for a side no player
     * owns — the raid boss, and any team a test or a future AI
     * trainer fields
     */
    public player = '',
  ) {}

  addUnit(unit: Unit): void {
    this.battle.emit(BattleEvents.TeamAddUnit, {
      id: 'TeamAddUnit',
      disabled: false,
      team: this,
      unit,
    });
  }

  removeUnit(unit: Unit): void {
    this.battle.emit(BattleEvents.TeamRemoveUnit, {
      id: 'TeamRemoveUnit',
      disabled: false,
      team: this,
      unit,
    });
  }

  status: { [key in TeamStatuses]?: EffectCause } = {};

  addStatus(status: TeamStatuses, cause: EffectCause): void {
    this.battle.emit(BattleEvents.TeamAddStatus, {
      id: 'TeamAddStatus',
      disabled: false,
      team: this,
      status,
      cause,
    });
  }

  removeStatus(status: TeamStatuses, cause: EffectCause): void {
    this.battle.emit(BattleEvents.TeamRemoveStatus, {
      id: 'TeamRemoveStatus',
      disabled: false,
      team: this,
      status,
      cause,
    });
  }

  weather = {
    current: Weathers.None,
    disabled: false,
  };

  setWeather(weather: Weathers): void {
    this.battle.emit(BattleEvents.TeamSetWeather, {
      id: 'TeamSetWeather',
      disabled: false,
      weather,
      team: this,
    });
  }

  checkStatusImmunity(status: TeamStatuses, cause: EffectCause): boolean {
    const event: CheckTeamStatusImmunityEvent = {
      id: 'CheckTeamStatusImmunity',
      disabled: false,
      team: this,
      status,
      cause,
      immune: false,
    };
    this.battle.emit(BattleEvents.CheckTeamStatusImmunity, event);
    return event.immune;
  }
}
