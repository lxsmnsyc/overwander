import { type TeamStatuses, Weathers } from '../data/ids/status';
import type Alliance from './alliance';
import type Battle from './core';
import {
  BattleEvents,
  type CheckTeamStatusDurationEvent,
  type CheckTeamStatusImmunityEvent,
  type EffectCause,
} from './events';
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

  /**
   * How long a status the team has just been put under lasts. It is
   * the team-wide twin of a unit's own check, and the cause is passed
   * on because what lengthens a screen — a Light Clay — is held by
   * whoever put the screen up rather than by the team standing behind
   * it
   */
  checkStatusDuration(status: TeamStatuses, duration: number, cause: EffectCause): number {
    const event: CheckTeamStatusDurationEvent = {
      id: 'CheckTeamStatusDuration',
      disabled: false,
      team: this,
      status,
      duration,
      cause,
    };
    this.battle.emit(BattleEvents.CheckTeamStatusDuration, event);
    return event.duration;
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

  setWeather(weather: Weathers, duration = 0): void {
    this.battle.emit(BattleEvents.TeamSetWeather, {
      id: 'TeamSetWeather',
      disabled: false,
      weather,
      duration,
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
