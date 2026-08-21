import { type Slots, defaultSlots, getSlots } from '../data/constants/slots';
import type { Stats } from '../data/constants/stats';
import { Stages, StatsKind, createStatsField } from '../data/constants/stats';
import { Types } from '../data/constants/types';
import type Abilities from '../data/ids/abilities';
import type { Items } from '../data/ids/items';
import type { MoveCategories, Moves } from '../data/ids/moves';
import Natures from '../data/ids/natures';
import { Genders, Species } from '../data/ids/species';
import { type Statuses, Weathers } from '../data/ids/status';
import type Battle from './core';
import type {
  CastingData,
  ChannelingData,
  CheckUnitAbilityEvent,
  CheckUnitCanCastEvent,
  CheckUnitCanChannelEvent,
  CheckUnitCanConsumeItemEvent,
  CheckUnitCanDamageEvent,
  CheckUnitCanHealEvent,
  CheckUnitCanUpdateStageEvent,
  CheckUnitDrainEvent,
  CheckUnitEscapeEvent,
  CheckUnitGroundedEvent,
  CheckUnitItemThresholdEvent,
  CheckUnitMoveAccuracyEvent,
  CheckUnitMoveContactEvent,
  CheckUnitMoveHitsEvent,
  CheckUnitMoveImmunityEvent,
  CheckUnitMovePPEvent,
  CheckUnitMovePowerEvent,
  CheckUnitMovePriorityEvent,
  CheckUnitMoveStepsEvent,
  CheckUnitMoveTargetFlagsEvent,
  CheckUnitMoveTimeEvent,
  CheckUnitMoveTypeEvent,
  CheckUnitStageEvent,
  CheckUnitStatEvent,
  CheckUnitStatusDurationEvent,
  CheckUnitStatusImmunityEvent,
  CheckUnitWeatherDurationEvent,
  CheckUnitWeightEvent,
  EffectCause,
  MoveState,
  MoveTarget,
  ProgressData,
  UnitAttackEvent,
  UnitDamageEvent,
  UnitWeatherEvent,
} from './events';
import { BattleEvents } from './events';
import type Team from './team';

export default class Unit {
  constructor(
    public battle: Battle,
    public team: Team,
    /**
     * The caught/{catchId} this unit was built from, empty when it
     * stands for no record — the raid boss, and units a test or a
     * future AI trainer builds outright
     */
    public caught = '',
  ) {}

  level = 0;

  setLevel(value: number): void {
    this.battle.emit(BattleEvents.UnitSetLevel, {
      id: 'UnitSetLevel',
      disabled: false,
      source: this,
      value,
    });
  }

  species = Species.Missingno;

  setSpecies(species: Species): void {
    this.battle.emit(BattleEvents.UnitSetSpecies, {
      id: 'UnitSetSpecies',
      disabled: false,
      source: this,
      species,
    });
  }

  /**
   * The species this unit looks like (e.g. Illusion, Transform).
   * Follows the actual species unless explicitly overridden.
   */
  appearance = Species.Missingno;

  setAppearance(species: Species): void {
    this.battle.emit(BattleEvents.UnitSetAppearance, {
      id: 'UnitSetAppearance',
      disabled: false,
      source: this,
      species,
    });
  }

  gender = Genders.Genderless;

  setGender(gender: Genders): void {
    this.battle.emit(BattleEvents.UnitSetGender, {
      id: 'UnitSetGender',
      disabled: false,
      source: this,
      gender,
    });
  }

  nature = Natures.Hardy;

  setNature(nature: Natures): void {
    this.battle.emit(BattleEvents.UnitSetNature, {
      id: 'UnitSetNature',
      disabled: false,
      source: this,
      nature,
    });
  }

  /**
   * How tall this individual stands, in meters
   */
  height = 0;

  setHeight(value: number): void {
    this.battle.emit(BattleEvents.UnitSetHeight, {
      id: 'UnitSetHeight',
      disabled: false,
      source: this,
      value,
    });
  }

  /**
   * What it has room for — abilities, items and moves — packed as the
   * catch record packs it. Read it with `checkSlots`; a unit nobody
   * measured has the room the game gives everything
   */
  slots = defaultSlots();

  setSlots(value: number): void {
    this.battle.emit(BattleEvents.UnitSetSlots, {
      id: 'UnitSetSlots',
      disabled: false,
      source: this,
      value,
    });
  }

  /**
   * How many of that kind it has room for **in this fight**: what the
   * pokemon itself has room for, held to whatever the battle allows.
   * A belt that bought a second item slot is worth nothing in a fight
   * that allows one
   */
  checkSlots(kind: Slots): number {
    return Math.min(getSlots(this.slots, kind), this.battle.checkLimit(kind));
  }

  /**
   * How heavy this individual is, in kilograms. Weight-driven moves
   * read it, and effects that lighten a unit set it
   */
  weight = 0;

  setWeight(value: number): void {
    this.battle.emit(BattleEvents.UnitSetWeight, {
      id: 'UnitSetWeight',
      disabled: false,
      source: this,
      value,
    });
  }

  health = 0;

  setHealth(value: number): void {
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

  setStat(kind: StatsKind, stat: Stats, value: number): void {
    this.battle.emit(BattleEvents.UnitSetStat, {
      id: 'UnitSetStat',
      disabled: false,
      source: this,
      stat,
      value,
      kind,
    });
  }

  checkStat(stat: Stats, flags: number): number {
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

  resolveStat(stat: Stats, flags: number): number {
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

  addType(type: Types): void {
    this.battle.emit(BattleEvents.UnitAddType, {
      id: 'UnitAddType',
      disabled: false,
      source: this,
      type,
    });
  }

  removeType(type: Types): void {
    this.battle.emit(BattleEvents.UnitRemoveType, {
      id: 'UnitRemoveType',
      disabled: false,
      source: this,
      type,
    });
  }

  interrupt(): void {
    this.battle.emit(BattleEvents.UnitInterrupt, {
      id: 'UnitInterrupt',
      disabled: false,
      source: this,
    });
  }

  casting?: CastingData;

  moves: { [key in Moves]?: MoveState } = {};

  addMove(move: Moves): void {
    this.battle.emit(BattleEvents.UnitAddMove, {
      id: 'UnitAddMove',
      disabled: false,
      source: this,
      move,
    });
  }

  /**
   * Say how many points have been spent on one of its moves. It is
   * written when the unit is fielded, out of the record it was copied
   * from, and nothing changes it mid-fight: a PP Up bought while a
   * raid is running belongs to the pokemon rather than to the copy in
   * the battle
   */
  setMovePoints(move: Moves, points: number): void {
    this.battle.emit(BattleEvents.UnitSetMovePoints, {
      id: 'UnitSetMovePoints',
      disabled: false,
      source: this,
      move,
      points,
    });
  }

  removeMove(move: Moves): void {
    this.battle.emit(BattleEvents.UnitRemoveMove, {
      id: 'UnitRemoveMove',
      disabled: false,
      source: this,
      move,
    });
  }

  enableMove(move: Moves): void {
    this.battle.emit(BattleEvents.UnitEnableMove, {
      id: 'UnitEnableMove',
      disabled: false,
      source: this,
      move,
    });
  }

  disableMove(move: Moves): void {
    this.battle.emit(BattleEvents.UnitDisableMove, {
      id: 'UnitDisableMove',
      disabled: false,
      source: this,
      move,
    });
  }

  checkCanCast(move: Moves, target: MoveTarget): boolean {
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

  cast(move: Moves, target: MoveTarget): void {
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

  updateCast(data: Partial<CastingData>): void {
    if (this.casting) {
      this.battle.emit(BattleEvents.UnitUpdateCast, {
        id: 'UnitUpdateCast',
        disabled: false,
        source: this,
        data,
      });
    }
  }

  stopCast(): void {
    if (this.casting) {
      this.battle.emit(BattleEvents.UnitStopCast, {
        id: 'UnitStopCast',
        disabled: false,
        source: this,
      });
    }
  }

  finishCast(): void {
    if (this.casting) {
      this.battle.emit(BattleEvents.UnitFinishCast, {
        id: 'UnitFinishCast',
        disabled: false,
        source: this,
      });
    }
  }

  startCooldown(move: Moves, target: MoveTarget): void {
    this.battle.emit(BattleEvents.UnitStartCooldown, {
      id: 'UnitStartCooldown',
      disabled: false,
      source: this,
      move,
      target,
    });
  }

  updateCooldown(move: Moves, data: Partial<ProgressData>): void {
    this.battle.emit(BattleEvents.UnitUpdateCooldown, {
      id: 'UnitUpdateCooldown',
      disabled: false,
      source: this,
      move,
      data,
    });
  }

  finishCooldown(move: Moves): void {
    this.battle.emit(BattleEvents.UnitFinishCooldown, {
      id: 'UnitFinishCooldown',
      disabled: false,
      source: this,
      move,
    });
  }

  channeling?: ChannelingData;

  checkCanChannel(move: Moves, target: MoveTarget, steps: number): boolean {
    const event: CheckUnitCanChannelEvent = {
      id: 'CheckUnitCanChannel',
      disabled: false,
      source: this,
      success: true,
      move,
      target,
      steps,
    };
    this.battle.emit(BattleEvents.CheckUnitCanChannel, event);
    return event.success;
  }

  channel(move: Moves, target: MoveTarget, steps: number): void {
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

  updateChannel(data: Partial<ChannelingData>): void {
    if (this.channeling) {
      this.battle.emit(BattleEvents.UnitUpdateChannel, {
        id: 'UnitUpdateChannel',
        disabled: false,
        source: this,
        data,
      });
    }
  }

  stopChannel(): void {
    if (this.channeling) {
      this.battle.emit(BattleEvents.UnitStopChannel, {
        id: 'UnitStopChannel',
        disabled: false,
        source: this,
      });
    }
  }

  finishChannel(): void {
    if (this.channeling) {
      this.battle.emit(BattleEvents.UnitFinishChannel, {
        id: 'UnitFinishChannel',
        disabled: false,
        source: this,
      });
    }
  }

  triggerMove(move: Moves, target: MoveTarget, steps: number): void {
    this.battle.emit(BattleEvents.UnitTriggerMove, {
      id: 'TriggerMove',
      disabled: false,
      source: this,
      move,
      target,
      steps,
    });
  }

  triggerMoveTarget(move: Moves, target: MoveTarget, steps: number): void {
    this.battle.emit(BattleEvents.UnitTriggerMoveTarget, {
      id: 'UnitTriggerMoveTarget',
      disabled: false,
      source: this,
      move,
      target,
      steps,
    });
  }

  triggerMoveEffect(move: Moves, target: MoveTarget, steps: number): void {
    this.battle.emit(BattleEvents.UnitTriggerMoveEffect, {
      id: 'UnitTriggerMoveEffect',
      disabled: false,
      source: this,
      move,
      target,
      steps,
    });
  }

  triggerMoveEffectFailed(move: Moves, target: MoveTarget, steps: number): void {
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

  /**
   * Every item that has left this unit's grip during the battle — a
   * berry it ate, or anything else a removal took away. The battle
   * itself does nothing with the set; it is what the fight reports
   * afterwards, so a consumed item comes off the catch record too
   */
  consumed = new Set<Items>();

  /**
   * The coins this unit's Pay Days scattered. Nothing in the battle
   * spends them; the fight reports them afterwards and the settle
   * pays them out
   */
  coins = 0;

  addItem(item: Items): void {
    this.battle.emit(BattleEvents.UnitAddItem, {
      id: 'UnitAddItem',
      disabled: false,
      source: this,
      item,
    });
  }

  removeItem(item: Items, cause: EffectCause): void {
    this.battle.emit(BattleEvents.UnitRemoveItem, {
      id: 'UnitRemoveItem',
      disabled: false,
      source: this,
      item,
      cause,
    });
  }

  triggerItem(item: Items): void {
    // Presence check (not truthiness): a consumed item is disabled
    // right before its trigger fires the effect
    if (this.items[item] != null) {
      this.battle.emit(BattleEvents.UnitTriggerItem, {
        id: 'UnitTriggerItem',
        disabled: false,
        source: this,
        item,
      });
    }
  }

  checkCanConsumeItem(item: Items): boolean {
    const event: CheckUnitCanConsumeItemEvent = {
      id: 'CheckUnitCanConsumeItem',
      disabled: false,
      source: this,
      item,
      success: true,
    };
    this.battle.emit(BattleEvents.CheckUnitCanConsumeItem, event);
    return event.success;
  }

  updateStatusTimer(status: Statuses, data: Partial<ProgressData>): void {
    if (this.status[status] != null) {
      this.battle.emit(BattleEvents.UnitUpdateStatusTimer, {
        id: 'UnitUpdateStatusTimer',
        disabled: false,
        source: this,
        status,
        data,
      });
    }
  }

  checkStatusDuration(status: Statuses, duration: number, cause: EffectCause): number {
    const event: CheckUnitStatusDurationEvent = {
      id: 'CheckUnitStatusDuration',
      disabled: false,
      source: this,
      status,
      duration,
      cause,
    };
    this.battle.emit(BattleEvents.CheckUnitStatusDuration, event);
    return event.duration;
  }

  checkItemThreshold(item: Items, threshold: number): number {
    const event: CheckUnitItemThresholdEvent = {
      id: 'CheckUnitItemThreshold',
      disabled: false,
      source: this,
      item,
      threshold,
    };
    this.battle.emit(BattleEvents.CheckUnitItemThreshold, event);
    return event.threshold;
  }

  /**
   * The amount this unit drains from the target; negative when the
   * drain backfires (e.g. Liquid Ooze)
   */
  checkDrain(target: Unit, value: number): number {
    const event: CheckUnitDrainEvent = {
      id: 'CheckUnitDrain',
      disabled: false,
      source: this,
      target,
      value,
    };
    this.battle.emit(BattleEvents.CheckUnitDrain, event);
    return event.value;
  }

  enableItem(item: Items): void {
    if (this.items[item] === false) {
      this.battle.emit(BattleEvents.UnitEnableItem, {
        id: 'UnitEnableItem',
        disabled: false,
        source: this,
        item,
      });
    }
  }

  disableItem(item: Items): void {
    if (this.items[item] === true) {
      this.battle.emit(BattleEvents.UnitDisableItem, {
        id: 'UnitDisableItem',
        disabled: false,
        source: this,
        item,
      });
    }
  }

  abilities: { [key in Abilities]?: boolean } = {};

  addAbility(ability: Abilities): void {
    this.battle.emit(BattleEvents.UnitAddAbility, {
      id: 'UnitAddAbility',
      disabled: false,
      source: this,
      ability,
    });
  }

  removeAbility(ability: Abilities): void {
    this.battle.emit(BattleEvents.UnitRemoveAbility, {
      id: 'UnitRemoveAbility',
      disabled: false,
      source: this,
      ability,
    });
  }

  hasAbility(ability: Abilities): boolean {
    const event: CheckUnitAbilityEvent = {
      id: 'CheckUnitAbility',
      disabled: false,
      source: this,
      ability,
      // The unit's own record is the baseline; suppressors (e.g.
      // Neutralizing Gas) may clear it
      enabled: this.abilities[ability] === true,
    };
    this.battle.emit(BattleEvents.CheckUnitAbility, event);
    return event.enabled;
  }

  triggerAbility(ability: Abilities): void {
    if (this.abilities[ability]) {
      this.battle.emit(BattleEvents.UnitTriggerAbility, {
        id: 'UnitTriggerAbility',
        disabled: false,
        source: this,
        ability,
      });
    }
  }

  enableAbility(ability: Abilities): void {
    if (this.abilities[ability] === false) {
      this.battle.emit(BattleEvents.UnitEnableAbility, {
        id: 'UnitEnableAbility',
        disabled: false,
        source: this,
        ability,
      });
    }
  }

  disableAbility(ability: Abilities): void {
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

  addStatus(status: Statuses, cause: EffectCause): void {
    if (this.checkStatusImmunity(status, cause)) {
      this.battle.emit(BattleEvents.UnitAddStatusFailed, {
        id: 'UnitAddStatusFailed',
        disabled: false,
        source: this,
        status,
        cause,
      });
    } else {
      this.battle.emit(BattleEvents.UnitAddStatus, {
        id: 'UnitAddStatus',
        disabled: false,
        source: this,
        status,
        cause,
      });
    }
  }

  removeStatus(status: Statuses, cause: EffectCause): void {
    this.battle.emit(BattleEvents.UnitRemoveStatus, {
      id: 'UnitRemoveStatus',
      disabled: false,
      source: this,
      status,
      cause,
    });
  }

  triggerStatus(status: Statuses, cause: EffectCause): void {
    this.battle.emit(BattleEvents.UnitTriggerStatus, {
      id: 'UnitTriggerStatus',
      disabled: false,
      source: this,
      status,
      cause,
    });
  }

  getStatus(status: Statuses): EffectCause | undefined {
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

  checkCanAddStage(stage: Stages, value: number, cause: EffectCause): boolean {
    const event: CheckUnitCanUpdateStageEvent = {
      id: 'CheckUnitCanAddStage',
      disabled: false,
      source: this,
      stage,
      value,
      cause,
      success: true,
    };
    this.battle.emit(BattleEvents.CheckUnitCanAddStage, event);
    return event.success;
  }

  addStage(stage: Stages, value: number, cause: EffectCause): void {
    if (this.checkCanAddStage(stage, value, cause)) {
      this.battle.emit(BattleEvents.UnitAddStage, {
        id: 'UnitAddStage',
        disabled: false,
        source: this,
        stage,
        value,
        cause,
      });
    }
  }

  checkCanRemoveStage(stage: Stages, value: number, cause: EffectCause): boolean {
    const event: CheckUnitCanUpdateStageEvent = {
      id: 'CheckUnitCanRemoveStage',
      disabled: false,
      source: this,
      stage,
      value,
      cause,
      success: true,
    };
    this.battle.emit(BattleEvents.CheckUnitCanRemoveStage, event);
    return event.success;
  }

  removeStage(stage: Stages, value: number, cause: EffectCause): void {
    if (this.checkCanRemoveStage(stage, value, cause)) {
      this.battle.emit(BattleEvents.UnitRemoveStage, {
        id: 'UnitRemoveStage',
        disabled: false,
        source: this,
        stage,
        value,
        cause,
      });
    }
  }

  resetStages(cause: EffectCause): void {
    this.battle.emit(BattleEvents.UnitResetStages, {
      id: 'UnitResetStages',
      disabled: false,
      source: this,
      cause,
    });
  }

  checkStage(stage: Stages, flags: number): number {
    const event: CheckUnitStageEvent = {
      id: 'CheckUnitStage',
      disabled: false,
      source: this,
      stage,
      value: 0,
      flags,
    };
    this.battle.emit(BattleEvents.CheckUnitStage, event);
    return event.value;
  }

  heal(cause: EffectCause, target: Unit, value: number, flags: number): void {
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

  damage(cause: EffectCause, target: Unit, value: number, flags: number): boolean {
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

  cure(cause: EffectCause): void {
    this.battle.emit(BattleEvents.UnitCure, {
      id: 'UnitCure',
      disabled: false,
      source: this,
      cause,
    });
  }

  alive = true;

  faint(attacker: Unit): void {
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
  ): boolean {
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

  switch(target: Unit): void {
    if (this.checkEscape() && target.checkEscape()) {
      this.forceSwitch(target);
    }
  }

  /**
   * Switch without the escape checks (e.g. forced switch-out moves
   * that bypass trapping)
   */
  forceSwitch(target: Unit): void {
    this.battle.emit(BattleEvents.UnitSwitch, {
      id: 'UnitSwitch',
      disabled: false,
      source: this,
      target,
    });
  }

  /**
   * Put a fainted unit back on its feet on the given health. It is a
   * re-entry rather than a fresh one: nothing that happens once on
   * arrival happens again
   */
  revive(value: number): void {
    this.battle.emit(BattleEvents.UnitRevives, {
      id: 'UnitRevives',
      disabled: false,
      source: this,
      value,
    });
  }

  enter(reactivation = false): void {
    this.battle.emit(BattleEvents.UnitEntersField, {
      id: 'UnitEntersField',
      disabled: false,
      source: this,
      reactivation,
    });
  }

  leave(): void {
    this.battle.emit(BattleEvents.UnitLeavesField, {
      id: 'UnitLeavesField',
      disabled: false,
      source: this,
    });
  }

  checkEscape(): boolean {
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
  checkMoveType(move: Moves, target: MoveTarget): Types {
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

  checkMoveImmunity(move: Moves, target: MoveTarget, type: Types): boolean {
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

  checkMoveAccuracy(move: Moves, target: MoveTarget): number | undefined {
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

  checkMovePower(move: Moves, target: MoveTarget): number | undefined {
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

  checkMovePP(move: Moves, target: MoveTarget): number {
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

  checkMovePriority(move: Moves, target: MoveTarget): number {
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

  checkMoveSteps(move: Moves, target: MoveTarget): number {
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

  /**
   * What the unit weighs to anything that reads it, which is not
   * always what it stores: a Float Stone lightens its holder
   */
  checkWeight(): number {
    const event: CheckUnitWeightEvent = {
      id: 'CheckUnitWeight',
      disabled: false,
      source: this,
      weight: this.weight,
    };
    this.battle.emit(BattleEvents.CheckUnitWeight, event);
    return Math.max(0.1, event.weight);
  }

  /**
   * Whether a blow of this move counts as contact against the target.
   * Everything that answers being touched reads this rather than the
   * move's own flag, so a Protective Pads is one veto rather than a
   * clause in each of them
   */
  checkMoveContact(move: Moves, target: MoveTarget): boolean {
    const event: CheckUnitMoveContactEvent = {
      id: 'CheckUnitMoveContact',
      disabled: false,
      source: this,
      move,
      target,
      contact: false,
    };
    this.battle.emit(BattleEvents.CheckUnitMoveContact, event);
    return event.contact;
  }

  checkGrounded(): boolean {
    const event: CheckUnitGroundedEvent = {
      id: 'CheckUnitGrounded',
      disabled: false,
      source: this,
      grounded: true,
    };
    this.battle.emit(BattleEvents.CheckUnitGrounded, event);
    return event.grounded;
  }

  /**
   * Call up weather. It stays out until something changes it unless a
   * duration is given: a sky nobody is holding open — the one the
   * overworld handed the battle, a primal one — has no clock on it,
   * and the weather moves are what put one there
   */
  setWeather(weather: Weathers, duration = 0): void {
    this.battle.emit(BattleEvents.UnitSetWeather, {
      id: 'UnitSetWeather',
      disabled: false,
      source: this,
      weather,
      // Scope is resolved by the weather mechanics (battle mode) and
      // listeners (e.g. Boss) that widen it
      global: false,
      duration,
    });
  }

  /**
   * How long weather this unit calls up stays out. The rocks answer
   * here
   */
  checkWeatherDuration(weather: Weathers, duration: number): number {
    const event: CheckUnitWeatherDurationEvent = {
      id: 'CheckUnitWeatherDuration',
      disabled: false,
      source: this,
      weather,
      duration,
    };
    this.battle.emit(BattleEvents.CheckUnitWeatherDuration, event);
    return event.duration;
  }

  checkMoveTargetFlags(move: Moves): number {
    const event: CheckUnitMoveTargetFlagsEvent = {
      id: 'CheckUnitMoveTargetFlags',
      disabled: false,
      source: this,
      move,
      flags: 0,
    };
    this.battle.emit(BattleEvents.CheckUnitMoveTargetFlags, event);
    return event.flags;
  }

  checkMoveHits(move: Moves, target: MoveTarget, hits: number, max: number): number {
    const event: CheckUnitMoveHitsEvent = {
      id: 'CheckUnitMoveHits',
      disabled: false,
      source: this,
      move,
      target,
      hits,
      max,
    };
    this.battle.emit(BattleEvents.CheckUnitMoveHits, event);
    return event.hits;
  }

  /**
   * Whether damage may land on this unit at all. Asked once before
   * the damage is emitted, so a blanket immunity answers a question
   * rather than racing to disable the event
   */
  checkCanDamage(cause: EffectCause, source: Unit, value: number, flags: number): boolean {
    const event: CheckUnitCanDamageEvent = {
      id: 'CheckUnitCanDamage',
      disabled: false,
      source,
      target: this,
      value,
      flags,
      cause,
      success: true,
    };

    this.battle.emit(BattleEvents.CheckUnitCanDamage, event);
    return event.success;
  }

  /**
   * Whether health may go back on this unit at all. The mirror of
   * `checkCanDamage`, and asked the same way: once, before the heal is
   * emitted, so a refusal is a verdict rather than a race
   */
  checkCanHeal(cause: EffectCause, source: Unit, value: number, flags: number): boolean {
    const event: CheckUnitCanHealEvent = {
      id: 'CheckUnitCanHeal',
      disabled: false,
      source,
      target: this,
      value,
      flags,
      cause,
      success: true,
    };

    this.battle.emit(BattleEvents.CheckUnitCanHeal, event);
    return event.success;
  }

  checkStatusImmunity(status: Statuses, cause: EffectCause): boolean {
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

  checkWeather(): Weathers {
    const event: UnitWeatherEvent = {
      id: 'CheckUnitWeather',
      disabled: false,
      source: this,
      weather: Weathers.None,
    };
    this.battle.emit(BattleEvents.CheckUnitWeather, event);
    return event.weather;
  }

  checkMoveCastTime(move: Moves, target: MoveTarget): number {
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

  checkMoveChannelTime(move: Moves, target: MoveTarget): number {
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

  checkMoveDuration(move: Moves, target: MoveTarget): number {
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

  checkMoveDelay(move: Moves, target: MoveTarget): number {
    const event: CheckUnitMoveTimeEvent = {
      id: 'CheckUnitMoveDelay',
      disabled: false,
      source: this,
      move,
      duration: 0,
      target,
    };
    this.battle.emit(BattleEvents.CheckUnitMoveDelay, event);
    return event.duration;
  }
}
