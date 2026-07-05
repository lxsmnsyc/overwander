import type { Stats } from '../data/constants/stats';
import { createStatsField, Stages, StatsKind } from '../data/constants/stats';
import { Types } from '../data/constants/types';
import type { Abilities } from '../data/ids/abilities';
import type { Items } from '../data/ids/items';
import type { MoveCategories, Moves } from '../data/ids/moves';
import { Weathers, type Statuses } from '../data/ids/status';
import type { Battle } from './core';
import type {
  CastingData,
  ChannelingData,
  CheckUnitCanCastEvent,
  CheckUnitCanChannelEvent,
  CheckUnitEscapeEvent,
  CheckUnitMoveAccuracyEvent,
  CheckUnitMoveImmunityEvent,
  CheckUnitMovePowerEvent,
  CheckUnitMovePPEvent,
  CheckUnitMovePriorityEvent,
  CheckUnitMoveStepsEvent,
  CheckUnitMoveTimeEvent,
  CheckUnitMoveTypeEvent,
  CheckUnitStageEvent,
  CheckUnitStatEvent,
  CheckUnitStatusImmunityEvent,
  EffectCause,
  MoveState,
  MoveTarget,
  ProgressData,
  UnitAttackEvent,
  UnitDamageEvent,
  UnitWeatherEvent,
} from './events';
import { BattleEvents } from './events';
import type { Team } from './team';

export class Unit {
  constructor(
    public battle: Battle,
    public team: Team,
  ) {}

  level = 0;

  setLevel(value: number) {
    this.battle.emit(BattleEvents.UnitSetLevel, {
      id: 'UnitSetLevel',
      disabled: false,
      source: this,
      value,
    });
  }

  /**
   * TODO:
   * - set appearance
   * - set species
   */

  health = 0;

  setHealth(value: number) {
    this.battle.emit(BattleEvents.UnitSetHealth, {
      id: 'UnitSetHealth',
      disabled: false,
      source: this,
      value,
    });
  }

  stats = {
    [StatsKind.Base]: createStatsField(),
    [StatsKind.Individual]: createStatsField(),
    [StatsKind.Effort]: createStatsField(),
  };

  setStat(kind: StatsKind, stat: Stats, value: number) {
    this.battle.emit(BattleEvents.UnitSetStat, {
      id: 'UnitSetStat',
      disabled: false,
      source: this,
      stat,
      value,
      kind,
    });
  }

  checkStat(stat: Stats, flags: number) {
    const event: CheckUnitStatEvent = {
      id: 'CheckUnitStat',
      disabled: false,
      source: this,
      stat,
      value: 0,
      flags,
    };
    this.battle.emit(BattleEvents.CheckUnitStat, event);
    return event.value;
  }

  resolveStat(stat: Stats, flags: number) {
    const event: CheckUnitStatEvent = {
      id: 'ResolveUnitStat',
      disabled: false,
      source: this,
      stat,
      value: 0,
      flags,
    };
    this.battle.emit(BattleEvents.ResolveUnitStat, event);
    return event.value;
  }

  types = new Set<Types>();

  addType(type: Types) {
    this.battle.emit(BattleEvents.UnitAddType, {
      id: 'UnitAddType',
      disabled: false,
      source: this,
      type,
    });
  }

  removeType(type: Types) {
    this.battle.emit(BattleEvents.UnitRemoveType, {
      id: 'UnitRemoveType',
      disabled: false,
      source: this,
      type,
    });
  }

  interrupt() {
    // TODO UnitInterrupt
  }

  casting?: CastingData;

  moves: { [key in Moves]?: MoveState } = {};

  addMove(move: Moves) {
    this.battle.emit(BattleEvents.UnitAddMove, {
      id: 'UnitAddMove',
      disabled: false,
      source: this,
      move,
    });
  }

  removeMove(move: Moves) {
    this.battle.emit(BattleEvents.UnitRemoveMove, {
      id: 'UnitRemoveMove',
      disabled: false,
      source: this,
      move,
    });
  }

  enableMove(move: Moves) {
    this.battle.emit(BattleEvents.UnitEnableMove, {
      id: 'UnitEnableMove',
      disabled: false,
      source: this,
      move,
    });
  }

  disableMove(move: Moves) {
    this.battle.emit(BattleEvents.UnitDisableMove, {
      id: 'UnitDisableMove',
      disabled: false,
      source: this,
      move,
    });
  }

  checkCanCast(move: Moves, target: MoveTarget) {
    const event: CheckUnitCanCastEvent = {
      id: 'CheckUnitCanCast',
      disabled: false,
      source: this,
      success: true,
      move,
      target,
    };
    this.battle.emit(BattleEvents.CheckUnitCanCast, event);
    return event.success;
  }

  cast(move: Moves, target: MoveTarget) {
    if (this.checkCanCast(move, target)) {
      this.battle.emit(BattleEvents.UnitCast, {
        id: 'UnitCast',
        disabled: false,
        source: this,
        move,
        target,
      });
    }
  }

  updateCast(data: Partial<CastingData>) {
    if (this.casting) {
      this.battle.emit(BattleEvents.UnitUpdateCast, {
        id: 'UnitUpdateCast',
        disabled: false,
        source: this,
        data,
      });
    }
  }

  stopCast() {
    if (this.casting) {
      this.battle.emit(BattleEvents.UnitStopCast, {
        id: 'UnitStopCast',
        disabled: false,
        source: this,
      });
    }
  }

  finishCast() {
    if (this.casting) {
      this.battle.emit(BattleEvents.UnitFinishCast, {
        id: 'UnitFinishCast',
        disabled: false,
        source: this,
      });
    }
  }

  startCooldown(move: Moves, target: MoveTarget) {
    this.battle.emit(BattleEvents.UnitStartCooldown, {
      id: 'UnitStartCooldown',
      disabled: false,
      source: this,
      move,
      target,
    });
  }

  updateCooldown(move: Moves, data: Partial<ProgressData>) {
    this.battle.emit(BattleEvents.UnitUpdateCooldown, {
      id: 'UnitUpdateCooldown',
      disabled: false,
      source: this,
      move,
      data,
    });
  }

  finishCooldown(move: Moves) {
    this.battle.emit(BattleEvents.UnitFinishCooldown, {
      id: 'UnitFinishCooldown',
      disabled: false,
      source: this,
      move,
    });
  }

  channeling?: ChannelingData;

  checkCanChannel(move: Moves, target: MoveTarget, steps: number) {
    const event: CheckUnitCanChannelEvent = {
      id: 'CheckUnitCanChannel',
      disabled: false,
      source: this,
      success: true,
      move,
      target,
      steps,
    };
    this.battle.emit(BattleEvents.CheckUnitCanCast, event);
    return event.success;
  }

  channel(move: Moves, target: MoveTarget, steps: number) {
    if (this.checkCanChannel(move, target, steps)) {
      this.battle.emit(BattleEvents.UnitChannel, {
        id: 'UnitChannel',
        disabled: false,
        source: this,
        move,
        target,
        steps,
      });
    }
  }

  updateChannel(data: Partial<ChannelingData>) {
    if (this.casting) {
      this.battle.emit(BattleEvents.UnitUpdateChannel, {
        id: 'UnitUpdateChannel',
        disabled: false,
        source: this,
        data,
      });
    }
  }

  stopChannel() {
    if (this.channeling) {
      this.battle.emit(BattleEvents.UnitStopChannel, {
        id: 'UnitStopChannel',
        disabled: false,
        source: this,
      });
    }
  }

  finishChannel() {
    if (this.channeling) {
      this.battle.emit(BattleEvents.UnitFinishChannel, {
        id: 'UnitFinishChannel',
        disabled: false,
        source: this,
      });
    }
  }

  triggerMove(move: Moves, target: MoveTarget, steps: number) {
    this.battle.emit(BattleEvents.UnitTriggerMove, {
      id: 'TriggerMove',
      disabled: false,
      source: this,
      move,
      target,
      steps,
    });
  }

  triggerMoveTarget(move: Moves, target: MoveTarget, steps: number) {
    this.battle.emit(BattleEvents.UnitTriggerMoveTarget, {
      id: 'UnitTriggerMoveTarget',
      disabled: false,
      source: this,
      move,
      target,
      steps,
    });
  }

  triggerMoveEffect(move: Moves, target: MoveTarget, steps: number) {
    this.battle.emit(BattleEvents.UnitTriggerMoveEffect, {
      id: 'UnitTriggerMoveEffect',
      disabled: false,
      source: this,
      move,
      target,
      steps,
    });
  }

  triggerMoveEffectFailed(move: Moves, target: MoveTarget, steps: number) {
    this.battle.emit(BattleEvents.UnitTriggerMoveEffectFailed, {
      id: 'UnitTriggerMoveEffectFailed',
      disabled: false,
      source: this,
      move,
      target,
      steps,
    });
  }

  items: { [key in Items]?: boolean } = {};

  addItem(item: Items) {
    this.battle.emit(BattleEvents.UnitAddItem, {
      id: 'UnitAddItem',
      disabled: false,
      source: this,
      item,
    });
  }

  removeItem(item: Items) {
    this.battle.emit(BattleEvents.UnitRemoveItem, {
      id: 'UnitRemoveItem',
      disabled: false,
      source: this,
      item,
    });
  }

  triggerItem(item: Items) {
    if (this.items[item]) {
      this.battle.emit(BattleEvents.UnitTriggerItem, {
        id: 'UnitTriggerItem',
        disabled: false,
        source: this,
        item,
      });
    }
  }

  enableItem(item: Items) {
    if (this.items[item] === false) {
      this.battle.emit(BattleEvents.UnitEnableItem, {
        id: 'UnitEnableItem',
        disabled: false,
        source: this,
        item,
      });
    }
  }

  disableItem(item: Items) {
    if (this.items[item] === true) {
      this.battle.emit(BattleEvents.UnitDisableItem, {
        id: 'UnitDisableItem',
        disabled: false,
        source: this,
        item,
      });
    }
  }

  abilities: { [key in Items]?: boolean } = {};

  addAbility(ability: Abilities) {
    this.battle.emit(BattleEvents.UnitAddAbility, {
      id: 'UnitAddAbility',
      disabled: false,
      source: this,
      ability,
    });
  }

  removeAbility(ability: Abilities) {
    this.battle.emit(BattleEvents.UnitRemoveAbility, {
      id: 'UnitRemoveAbility',
      disabled: false,
      source: this,
      ability,
    });
  }

  hasAbility(ability: Abilities) {
    return this.abilities[ability];
  }

  triggerAbility(ability: Abilities) {
    if (this.abilities[ability]) {
      this.battle.emit(BattleEvents.UnitTriggerAbility, {
        id: 'UnitTriggerAbility',
        disabled: false,
        source: this,
        ability,
      });
    }
  }

  enableAbility(ability: Abilities) {
    if (this.abilities[ability] === false) {
      this.battle.emit(BattleEvents.UnitEnableAbility, {
        id: 'UnitEnableAbility',
        disabled: false,
        source: this,
        ability,
      });
    }
  }

  disableAbility(ability: Abilities) {
    if (this.abilities[ability] === true) {
      this.battle.emit(BattleEvents.UnitDisableAbility, {
        id: 'UnitDisableAbility',
        disabled: false,
        source: this,
        ability,
      });
    }
  }

  // status
  status: { [key in Statuses]?: EffectCause } = {};

  addStatus(status: Statuses, cause: EffectCause) {
    if (!this.checkStatusImmunity(status, cause)) {
      this.battle.emit(BattleEvents.UnitAddStatus, {
        id: 'UnitAddStatus',
        disabled: false,
        source: this,
        status,
        cause,
      });
    }
  }

  removeStatus(status: Statuses, cause: EffectCause) {
    this.battle.emit(BattleEvents.UnitRemoveStatus, {
      id: 'UnitRemoveStatus',
      disabled: false,
      source: this,
      status,
      cause,
    });
  }

  triggerStatus(status: Statuses, cause: EffectCause) {
    this.battle.emit(BattleEvents.UnitTriggerStatus, {
      id: 'UnitTriggerStatus',
      disabled: false,
      source: this,
      status,
      cause,
    });
  }

  getStatus(status: Statuses) {
    return this.status[status];
  }

  stages: Record<Stages, number> = {
    [Stages.Accuracy]: 0,
    [Stages.Attack]: 0,
    [Stages.Defense]: 0,
    [Stages.Evasion]: 0,
    [Stages.SpecialAttack]: 0,
    [Stages.SpecialDefense]: 0,
    [Stages.Speed]: 0,
  };

  addStage(stage: Stages, value: number, cause: EffectCause) {
    this.battle.emit(BattleEvents.UnitAddStage, {
      id: 'UnitAddStage',
      disabled: false,
      source: this,
      stage,
      value,
      cause,
    });
  }

  removeStage(stage: Stages, value: number, cause: EffectCause) {
    this.battle.emit(BattleEvents.UnitRemoveStage, {
      id: 'UnitRemoveStage',
      disabled: false,
      source: this,
      stage,
      value,
      cause,
    });
  }

  checkStage(stage: Stages, flags: number) {
    const event: CheckUnitStageEvent = {
      id: 'CheckUnitStage',
      disabled: false,
      source: this,
      stage,
      value: 0,
      flags,
    };
    this.battle.emit(BattleEvents.CheckUnitStage, event);
    return event.stage;
  }

  heal(cause: EffectCause, target: Unit, value: number, flags: number) {
    this.battle.emit(BattleEvents.UnitHeal, {
      id: 'UnitHeal',
      disabled: false,
      source: this,
      target,
      value,
      flags,
      cause,
    });
  }

  damage(cause: EffectCause, target: Unit, value: number, flags: number) {
    const event: UnitDamageEvent = {
      id: 'UnitDamage',
      disabled: false,
      source: this,
      target,
      value,
      flags,
      cause,
      success: false,
    };
    this.battle.emit(BattleEvents.UnitDamage, event);
    return event.success;
  }

  alive = true;

  faint(attacker: Unit) {
    this.battle.emit(BattleEvents.UnitFaints, {
      id: 'UnitFaints',
      disabled: false,
      source: this,
      attacker,
    });
  }

  attack(
    target: Unit,
    move: Moves,
    power: number,
    type: Types,
    category: MoveCategories,
    flags: number,
  ) {
    const event: UnitAttackEvent = {
      id: 'UnitAttack',
      disabled: false,
      source: this,
      target,
      move,
      value: power,
      category,
      type,
      flags,
      success: false,
    };
    this.battle.emit(BattleEvents.UnitAttack, event);
    return event.success;
  }

  switch(target: Unit) {
    if (this.checkEscape() && target.checkEscape()) {
      this.battle.emit(BattleEvents.UnitSwitch, {
        id: 'UnitSwitch',
        disabled: false,
        source: this,
        target,
      });
    }
  }

  enter() {
    this.battle.emit(BattleEvents.UnitEntersField, {
      id: 'UnitEntersField',
      disabled: false,
      source: this,
    });
  }

  leave() {
    this.battle.emit(BattleEvents.UnitLeavesField, {
      id: 'UnitEntersField',
      disabled: false,
      source: this,
    });
  }

  checkEscape() {
    const event: CheckUnitEscapeEvent = {
      id: 'CheckUnitEscape',
      disabled: false,
      source: this,
      success: true,
    };

    this.battle.emit(BattleEvents.CheckUnitEscape, event);

    return event.success;
  }

  // Checks
  checkMoveType(move: Moves, target: MoveTarget) {
    const event: CheckUnitMoveTypeEvent = {
      id: 'CheckUnitMoveType',
      disabled: false,
      source: this,
      move,
      target,
      type: Types.Unknown,
    };
    this.battle.emit(BattleEvents.CheckUnitMoveType, event);
    return event.type;
  }

  checkMoveImmunity(move: Moves, target: MoveTarget, type: Types) {
    const event: CheckUnitMoveImmunityEvent = {
      id: 'CheckUnitMoveImmunity',
      disabled: false,
      source: this,
      move,
      target,
      type,
      immune: false,
    };
    this.battle.emit(BattleEvents.CheckUnitMoveImmunity, event);
    return event.immune;
  }

  checkMoveAccuracy(move: Moves, target: MoveTarget) {
    const event: CheckUnitMoveAccuracyEvent = {
      id: 'CheckUnitMoveAccuracy',
      disabled: false,
      source: this,
      move,
      target,
    };
    this.battle.emit(BattleEvents.CheckUnitMoveAccuracy, event);
    return event.accuracy;
  }

  checkMovePower(move: Moves, target: MoveTarget) {
    const event: CheckUnitMovePowerEvent = {
      id: 'CheckUnitMovePower',
      disabled: false,
      source: this,
      move,
      target,
    };
    this.battle.emit(BattleEvents.CheckUnitMovePower, event);
    return event.power;
  }

  checkMovePP(move: Moves, target: MoveTarget) {
    const event: CheckUnitMovePPEvent = {
      id: 'CheckMovePP',
      disabled: false,
      source: this,
      move,
      pp: 0,
      target,
    };
    this.battle.emit(BattleEvents.CheckUnitMovePP, event);
    return event.pp;
  }

  checkMovePriority(move: Moves, target: MoveTarget) {
    const event: CheckUnitMovePriorityEvent = {
      id: 'CheckUnitMovePriority',
      disabled: false,
      source: this,
      move,
      priority: 0,
      target,
    };
    this.battle.emit(BattleEvents.CheckUnitMovePriority, event);
    return event.priority;
  }

  checkMoveSteps(move: Moves, target: MoveTarget) {
    const event: CheckUnitMoveStepsEvent = {
      id: 'CheckUnitMoveSteps',
      disabled: false,
      source: this,
      move,
      steps: 0,
      target,
    };
    this.battle.emit(BattleEvents.CheckUnitMoveSteps, event);
    return event.steps;
  }

  checkStatusImmunity(status: Statuses, cause: EffectCause) {
    const event: CheckUnitStatusImmunityEvent = {
      id: 'CheckUnitStatusImmunity',
      disabled: false,
      source: this,
      status,
      cause,
      immune: false,
    };
    this.battle.emit(BattleEvents.CheckUnitStatusImmunity, event);
    return event.immune;
  }

  checkWeather() {
    const event: UnitWeatherEvent = {
      id: 'CheckUnitWeather',
      disabled: false,
      source: this,
      weather: Weathers.None,
    };
    this.battle.emit(BattleEvents.CheckUnitWeather, event);
    return event.weather;
  }

  checkMoveCastTime(move: Moves, target: MoveTarget) {
    const event: CheckUnitMoveTimeEvent = {
      id: 'CheckUnitMoveCastTime',
      disabled: false,
      source: this,
      move,
      duration: 0,
      target,
    };
    this.battle.emit(BattleEvents.CheckUnitMoveCastTime, event);
    return event.duration;
  }

  checkMoveChannelTime(move: Moves, target: MoveTarget) {
    const event: CheckUnitMoveTimeEvent = {
      id: 'CheckUnitMoveChannelTime',
      disabled: false,
      source: this,
      move,
      duration: 0,
      target,
    };
    this.battle.emit(BattleEvents.CheckUnitMoveChannelTime, event);
    return event.duration;
  }

  checkMoveDuration(move: Moves, target: MoveTarget) {
    const event: CheckUnitMoveTimeEvent = {
      id: 'CheckUnitMoveDuration',
      disabled: false,
      source: this,
      move,
      duration: 0,
      target,
    };
    this.battle.emit(BattleEvents.CheckUnitMoveDuration, event);
    return event.duration;
  }
}
