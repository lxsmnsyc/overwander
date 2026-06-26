import type { Stats } from '../data/constants/stats';
import { Stages, StatsKind, createStatsField } from '../data/constants/stats';
import { Types } from '../data/constants/types';
import type { Abilities } from '../data/ids/abilities';
import type { Items } from '../data/ids/items';
import type { MoveCategories, Moves } from '../data/ids/moves';
import type { Statuses } from '../data/ids/status';
import type { Battle } from './core';
import type {
  CheckMoveAccuracyEvent,
  CheckMoveImmunityEvent,
  CheckMovePPEvent,
  CheckMovePowerEvent,
  CheckMovePriorityEvent,
  CheckMoveTypeEvent,
  CheckUnitCanCastEvent,
  CheckUnitEscapeEvent,
  CheckUnitStageEvent,
  CheckUnitStatEvent,
  CheckUnitStatusImmunityEvent,
  EffectCause,
  MoveTarget,
} from './events';
import { BattleEvents } from './events';
import type { Move } from './move';
import type { Team } from './team';

export class Unit {
  constructor(
    public battle: Battle,
    public team: Team,
  ) {}

  triggerMove(move: Moves, target: MoveTarget) {
    this.battle.emit(BattleEvents.TriggerMove, {
      id: 'TriggerMove',
      disabled: false,
      source: this,
      move,
      target,
    });
  }

  triggerMoveTarget(move: Moves, target: MoveTarget) {
    this.battle.emit(BattleEvents.TriggerMoveTarget, {
      id: 'TriggerMoveTarget',
      disabled: false,
      source: this,
      move,
      target,
    });
  }

  triggerMoveEffect(move: Moves, target: MoveTarget) {
    this.battle.emit(BattleEvents.TriggerMoveEffect, {
      id: 'TriggerMoveEffect',
      disabled: false,
      source: this,
      move,
      target,
    });
  }

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

  moves = new Set<Move>();

  casting?: Move;

  addMove(move: Move) {
    this.battle.emit(BattleEvents.UnitAddMove, {
      id: 'UnitAddMove',
      disabled: false,
      source: this,
      move,
    });
  }

  removeMove(move: Move) {
    this.battle.emit(BattleEvents.UnitRemoveMove, {
      id: 'UnitRemoveMove',
      disabled: false,
      source: this,
      move,
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
    this.battle.emit(BattleEvents.UnitDamage, {
      id: 'UnitDamage',
      disabled: false,
      source: this,
      target,
      value,
      flags,
      cause,
    });
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
    this.battle.emit(BattleEvents.UnitAttack, {
      id: 'UnitAttack',
      disabled: false,
      source: this,
      target,
      move,
      value: power,
      category,
      type,
      flags,
    });
  }

  switch(target: Unit) {
    if (this.checkEscape()) {
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
  checkMoveType(move: Moves, target: Unit) {
    const event: CheckMoveTypeEvent = {
      id: 'CheckMoveType',
      disabled: false,
      source: this,
      move,
      target,
      type: Types.Unknown,
    };
    this.battle.emit(BattleEvents.CheckMoveType, event);
    return event.type;
  }

  checkMoveImmunity(move: Moves, target: Unit, type: Types) {
    const event: CheckMoveImmunityEvent = {
      id: 'CheckMoveImmunity',
      disabled: false,
      source: this,
      move,
      target,
      type,
      immune: false,
    };
    this.battle.emit(BattleEvents.CheckMoveImmunity, event);
    return event.type;
  }

  checkMoveAccuracy(move: Moves, target: Unit) {
    const event: CheckMoveAccuracyEvent = {
      id: 'CheckMoveAccuracy',
      disabled: false,
      source: this,
      move,
      target,
    };
    this.battle.emit(BattleEvents.CheckMoveAccuracy, event);
    return event.accuracy;
  }

  checkMovePower(move: Moves, target: Unit) {
    const event: CheckMovePowerEvent = {
      id: 'CheckMovePower',
      disabled: false,
      source: this,
      move,
      target,
    };
    this.battle.emit(BattleEvents.CheckMovePower, event);
    return event.power;
  }

  checkMovePP(move: Moves) {
    const event: CheckMovePPEvent = {
      id: 'CheckMovePP',
      disabled: false,
      source: this,
      move,
      pp: 0,
    };
    this.battle.emit(BattleEvents.CheckMovePP, event);
    return event.pp;
  }

  checkMovePriority(move: Moves) {
    const event: CheckMovePriorityEvent = {
      id: 'CheckMovePriority',
      disabled: false,
      source: this,
      move,
      priority: 0,
    };
    this.battle.emit(BattleEvents.CheckMovePriority, event);
    return event.priority;
  }

  checkCanCast() {
    const event: CheckUnitCanCastEvent = {
      id: 'CheckUnitCanCast',
      disabled: false,
      source: this,
      success: true,
    };
    this.battle.emit(BattleEvents.CheckUnitCanCast, event);
    return event.success;
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
}
