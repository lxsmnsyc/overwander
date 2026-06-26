import { type TeamStatuses, Weathers } from "../data/ids/status";
import type { Alliance } from "./alliance";
import type { Battle } from "./core";
import { BattleEvents } from "./events";
import type { Unit } from "./unit";

export class Team {
  units = new Set<Unit>();

  constructor(
    public battle: Battle,
    public alliance: Alliance,
  ) {}

  addUnit(unit: Unit) {
    this.battle.emit(BattleEvents.TeamAddUnit, {
      id: 'TeamAddUnit',
      disabled: false,
      team: this,
      unit,
    });
  }

  removeUnit(unit: Unit) {
    this.battle.emit(BattleEvents.TeamRemoveUnit, {
      id: 'TeamRemoveUnit',
      disabled: false,
      team: this,
      unit,
    });
  }

  status = new Set<TeamStatuses>();

  addStatus(status: TeamStatuses) {
    this.battle.emit(BattleEvents.TeamAddStatus, {
      id: 'TeamAddStatus',
      disabled: false,
      team: this,
      status,
    });
  }

  removeStatus(status: TeamStatuses) {
    this.battle.emit(BattleEvents.TeamRemoveStatus, {
      id: 'TeamRemoveStatus',
      disabled: false,
      team: this,
      status,
    });
  }

  weather = {
    current: Weathers.None,
    disabled: false,
  };

  setWeather(weather: Weathers) {
    this.battle.emit(BattleEvents.TeamSetWeather, {
      id: 'TeamSetWeather',
      disabled: false,
      weather,
      team: this,
    });
  }
}
