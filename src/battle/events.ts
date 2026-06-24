import type { BaseEvent, EventPriority } from '../core/event-emitter';
import type { EventMap } from '../core/event-engine';
import type { Stats } from '../data/constants/stats';
import type { Types } from '../data/constants/types';
import type { Abilities } from '../data/ids/abilities';
import type { Items } from '../data/ids/items';
import type { MoveCategories, Moves } from '../data/ids/moves';
import type { Stages, TeamStatuses, Weathers } from '../data/ids/status';
import type { Alliance, Move, Status, Team, Unit } from './core';

export const enum BattleEvents {
  // Core events
  Initialize,
  Start,
  End,
  Tick,

  // Cast events
  EnableMove,
  DisableMove,

  CheckMoveType,
  CheckMoveImmunity,
  CheckMoveAccuracy,
  CheckMovePP,
  CheckMovePower,
  CheckMovePriority,
  CheckMoveDuration,

  CheckUnitStat,
  CheckUnitStage,

  CheckUnitEscape,
  CheckUnitCanCast,

  CheckTypeEffectiveness,

  ResolveUnitStat,

  MoveStartCast,
  MoveEndCast,
  MoveStopCast,
  MoveUpdateCast,

  MoveStartCooldown,
  MoveEndCooldown,
  MoveUpdateCooldown,

  // Move events
  TriggerMove,

  TriggerMoveTarget,

  TriggerMoveResolveAccuracy,
  TriggerMoveRollHit,

  TriggerMoveMissed,

  TriggerMoveEffect,

  // Damage events
  UnitAttack,
  UnitAttackCheckCriticalRatio,
  UnitAttackResolveCriticalHit,
  UnitAttackResolveDamage,
  UnitAttackResolveStat,
  UnitAttackResolveSTAB,
  UnitAttackResolveCriticalMult,
  UnitAttackResolveEffectiveness,
  UnitAttackEffect,

  UnitDamage,
  UnitFaints,

  // Unit event
  UnitCreated,

  UnitEntersField,

  UnitSetStat,
  UnitSetLevel,
  UnitSetHealth,
  UnitSetMaxHealth,

  UnitAddType,
  UnitRemoveType,

  UnitAddStatus,
  UnitRemoveStatus,
  UnitTriggerStatus,

  UnitAddStage,
  UnitRemoveStage,
  UnitCheckStage,

  UnitAddMove,
  UnitRemoveMove,

  UnitAddItem,
  UnitRemoveItem,
  UnitTriggerItem,
  UnitEnableItem,
  UnitDisableItem,

  UnitAddAbility,
  UnitRemoveAbility,
  UnitTriggerAbility,
  UnitEnableAbility,
  UnitDisableAbility,

  // Field events
  SetWeather,
  SetTerrain,

  // Side events
  TeamAddUnit,
  TeamRemoveUnit,
  TeamAddStatus,
  TeamRemoveStatus,
  TeamSetWeather,

  AllianceAddTeam,
  AllianceRemoveTeam,

  AddAlliance,
  RemoveAlliance,
}

export const enum MoveTargetType {
  Unit = 1,
  Team = 2,
  None = 3,
}

export type MoveTarget =
  | { type: MoveTargetType.Unit; unit: Unit }
  | { type: MoveTargetType.Team; team: Team }
  | { type: MoveTargetType.None };

export interface TickEvent extends BaseEvent {
  duration: number;
}

export interface WeatherEvent extends BaseEvent {
  weather: Weathers;
}

export interface UnitEvent extends BaseEvent {
  source: Unit;
}

export interface CheckMoveEvent extends UnitEvent {
  move: Moves;
}

export interface CheckMoveTargetEvent extends CheckMoveEvent {
  target: Unit;
}

export interface CheckMoveTypeEvent extends CheckMoveTargetEvent {
  type: Types;
}

export interface CheckMoveImmunityEvent extends CheckMoveTypeEvent {
  immune: boolean;
}

export interface CheckMoveAccuracyEvent extends CheckMoveTargetEvent {
  accuracy?: number;
}

export interface CheckMovePPEvent extends CheckMoveEvent {
  pp: number;
}

export interface CheckMovePowerEvent extends CheckMoveTargetEvent {
  power?: number;
}

export interface CheckMovePriorityEvent extends CheckMoveEvent {
  priority: number;
}

export interface CheckMoveDurationEvent extends CheckMoveEvent {
  duration: number;
}

export interface UnitStatEvent extends UnitEvent {
  stat: Stats;
}

export interface CheckUnitStatEvent extends UnitStatEvent {
  value: number;
  flags: number;
}

export interface CheckUnitEscapeEvent extends UnitEvent {
  success: boolean;
}

export interface UnitStageEvent extends UnitEvent {
  stage: Stages;
}

export interface CheckUnitStageEvent extends UnitStageEvent {
  value: number;
  flags: number;
}

export interface TriggerMoveEvent extends UnitEvent {
  move: Moves;
  target: MoveTarget;
}

export interface UnitSetValueEvent extends UnitEvent {
  value: number;
}

export interface UnitSetStatEvent extends UnitStatEvent {
  value: number;
}

export interface UnitTypeEvent extends UnitEvent {
  type: Types;
}

export interface UnitStatusEvent extends UnitEvent {
  status: Status;
}

export interface TriggerMoveMissedEvent extends BaseEvent {
  parent: TriggerMoveTargetEvent;
}

export interface TriggerMoveCheckPowerEvent extends BaseEvent {
  parent: TriggerMoveTargetEvent;
  power?: number;
}

export interface TriggerMoveCheckAccuracyEvent extends BaseEvent {
  parent: TriggerMoveTargetEvent;
  accuracy?: number;
}

export interface TriggerMoveResolveAccuracyEvent extends BaseEvent {
  parent: TriggerMoveTargetEvent;
  accuracy: number;
}

export interface TriggerMoveRollHitEvent
  extends TriggerMoveResolveAccuracyEvent {
  hit: boolean;
}

export interface TriggerMoveTargetEvent extends UnitEvent {
  move: Moves;
  target: MoveTarget;
}

export interface UnitStageEvent extends UnitEvent {
  stage: Stages;
  value: number;
}

export interface TeamEvent extends BaseEvent {
  team: Team;
}

export interface TeamStatusEvent extends TeamEvent {
  status: TeamStatuses;
}

export interface TeamUnitEvent extends TeamEvent {
  unit: Unit;
}

export interface TeamWeatherEvent extends TeamEvent {
  weather: Weathers;
}

export interface UnitDamageEvent extends UnitEvent {
  target: Unit;
  value: number;
  flags: number;
}

export interface UnitFaintsEvent extends UnitEvent {
  attacker: Unit;
}

export interface UnitAttackEvent extends UnitDamageEvent {
  target: Unit;
  value: number;

  move: Moves;
  category: MoveCategories;
  type: Types;
}

export interface UnitAttackChildEvent extends BaseEvent {
  parent: UnitAttackEvent;
}

export interface UnitAttackResolveEffectivenessEvent
  extends UnitAttackChildEvent {
  defendingType: Types;
  multiplier: number;
}

export interface UnitAttackResolveAmountEvent extends UnitAttackChildEvent {
  value: number;
}

export interface UnitAttackResolveCriticalEvent
  extends UnitAttackResolveAmountEvent {
  critical: boolean;
}

export interface UnitAttackResolveStatEvent
  extends UnitAttackResolveAmountEvent {
  stat: Stats;
}

export interface AllianceEvent extends BaseEvent {
  alliance: Alliance;
}

export interface AllianceTeamEvent extends AllianceEvent {
  team: Team;
}

export interface UnitAbilityEvent extends UnitEvent {
  ability: Abilities;
}

export interface UnitItemEvent extends UnitEvent {
  item: Items;
}

export interface UnitMoveEvent extends UnitEvent {
  move: Move;
}

export interface MoveEvent extends BaseEvent {
  move: Move;
}

export interface MoveCastEvent extends MoveEvent {
  target: MoveTarget;
}

export interface MoveCheckPriorityEvent extends MoveCastEvent {
  priority: number;
}

export interface MoveUpdateCastEvent extends MoveEvent {
  casting: CastingData;
}

export interface MoveUpdateCooldownEvent extends MoveEvent {
  cooldown: CooldownData;
}

export interface BattleEventMap extends EventMap {
  [BattleEvents.Initialize]: [BaseEvent, EventPriority];
  [BattleEvents.Start]: [BaseEvent, EventPriority];
  [BattleEvents.End]: [BaseEvent, EventPriority];
  [BattleEvents.Tick]: [TickEvent, EventPriority];

  // Checks
  [BattleEvents.CheckMoveType]: [CheckMoveTypeEvent, EventPriority];
  [BattleEvents.CheckMoveAccuracy]: [CheckMoveAccuracyEvent, EventPriority];
  [BattleEvents.CheckMoveImmunity]: [CheckMoveImmunityEvent, EventPriority];
  [BattleEvents.CheckMovePP]: [CheckMovePPEvent, EventPriority];
  [BattleEvents.CheckMovePower]: [CheckMovePowerEvent, EventPriority];
  [BattleEvents.CheckMovePriority]: [CheckMovePriorityEvent, EventPriority];
  [BattleEvents.CheckMoveDuration]: [CheckMoveDurationEvent, EventPriority];

  [BattleEvents.CheckUnitStat]: [CheckUnitStatEvent, EventPriority];
  [BattleEvents.CheckUnitStage]: [CheckUnitStageEvent, EventPriority];
  [BattleEvents.CheckUnitEscape]: [CheckUnitEscapeEvent, EventPriority];

  [BattleEvents.ResolveUnitStat]: [CheckUnitStatEvent, EventPriority];

  // Cast events
  [BattleEvents.MoveStartCast]: [MoveCastEvent, EventPriority];
  [BattleEvents.MoveEndCast]: [MoveCastEvent, EventPriority];
  [BattleEvents.MoveStopCast]: [MoveCastEvent, EventPriority];
  [BattleEvents.MoveUpdateCast]: [MoveUpdateCastEvent, EventPriority];

  [BattleEvents.MoveStartCooldown]: [UnitMoveEvent, EventPriority];
  [BattleEvents.MoveEndCooldown]: [UnitMoveEvent, EventPriority];
  [BattleEvents.MoveUpdateCooldown]: [MoveUpdateCooldownEvent, EventPriority];

  [BattleEvents.TriggerMove]: [TriggerMoveEvent, EventPriority];

  [BattleEvents.TriggerMoveTarget]: [TriggerMoveTargetEvent, EventPriority];

  [BattleEvents.TriggerMoveEffect]: [TriggerMoveTargetEvent, EventPriority];

  [BattleEvents.TriggerMoveResolveAccuracy]: [
    TriggerMoveResolveAccuracyEvent,
    EventPriority,
  ];
  [BattleEvents.TriggerMoveRollHit]: [TriggerMoveRollHitEvent, EventPriority];
  [BattleEvents.TriggerMoveMissed]: [TriggerMoveMissedEvent, EventPriority];

  // Unit events
  [BattleEvents.UnitAddStatus]: [UnitStatusEvent, EventPriority];
  [BattleEvents.UnitRemoveStatus]: [UnitStatusEvent, EventPriority];
  [BattleEvents.UnitTriggerStatus]: [UnitStatusEvent, EventPriority];

  [BattleEvents.UnitSetLevel]: [UnitSetValueEvent, EventPriority];
  [BattleEvents.UnitSetHealth]: [UnitSetValueEvent, EventPriority];
  [BattleEvents.UnitSetStat]: [UnitSetStatEvent, EventPriority];

  [BattleEvents.UnitAddType]: [UnitTypeEvent, EventPriority];
  [BattleEvents.UnitRemoveType]: [UnitTypeEvent, EventPriority];

  [BattleEvents.UnitAddStage]: [UnitStageEvent, EventPriority];
  [BattleEvents.UnitRemoveStage]: [UnitStageEvent, EventPriority];
  [BattleEvents.UnitCheckStage]: [UnitStageEvent, EventPriority];

  [BattleEvents.UnitAttack]: [UnitAttackEvent, EventPriority];
  [BattleEvents.UnitAttackCheckCriticalRatio]: [
    UnitAttackResolveAmountEvent,
    EventPriority,
  ];
  [BattleEvents.UnitAttackResolveCriticalHit]: [
    UnitAttackResolveCriticalEvent,
    EventPriority,
  ];
  [BattleEvents.UnitAttackResolveDamage]: [
    UnitAttackResolveAmountEvent,
    EventPriority,
  ];
  [BattleEvents.UnitAttackResolveStat]: [
    UnitAttackResolveStatEvent,
    EventPriority,
  ];
  [BattleEvents.UnitAttackResolveSTAB]: [
    UnitAttackResolveAmountEvent,
    EventPriority,
  ];
  [BattleEvents.UnitAttackResolveCriticalMult]: [
    UnitAttackResolveAmountEvent,
    EventPriority,
  ];
  [BattleEvents.UnitAttackResolveEffectiveness]: [
    UnitAttackResolveEffectivenessEvent,
    EventPriority,
  ];
  [BattleEvents.UnitAttackEffect]: [UnitAttackChildEvent, EventPriority];

  [BattleEvents.UnitDamage]: [UnitDamageEvent, EventPriority];
  [BattleEvents.UnitFaints]: [UnitFaintsEvent, EventPriority];
  [BattleEvents.UnitEntersField]: [UnitEvent, EventPriority];

  [BattleEvents.UnitAddAbility]: [UnitAbilityEvent, EventPriority];
  [BattleEvents.UnitRemoveAbility]: [UnitAbilityEvent, EventPriority];
  [BattleEvents.UnitEnableAbility]: [UnitAbilityEvent, EventPriority];
  [BattleEvents.UnitDisableAbility]: [UnitAbilityEvent, EventPriority];
  [BattleEvents.UnitTriggerAbility]: [UnitAbilityEvent, EventPriority];

  [BattleEvents.UnitAddItem]: [UnitItemEvent, EventPriority];
  [BattleEvents.UnitRemoveItem]: [UnitItemEvent, EventPriority];

  [BattleEvents.UnitEnableItem]: [UnitItemEvent, EventPriority];
  [BattleEvents.UnitDisableItem]: [UnitItemEvent, EventPriority];
  [BattleEvents.UnitTriggerItem]: [UnitItemEvent, EventPriority];

  [BattleEvents.UnitAddMove]: [UnitMoveEvent, EventPriority];
  [BattleEvents.UnitRemoveMove]: [UnitMoveEvent, EventPriority];

  [BattleEvents.EnableMove]: [MoveEvent, EventPriority];
  [BattleEvents.DisableMove]: [MoveEvent, EventPriority];

  // Team events
  [BattleEvents.TeamAddUnit]: [TeamUnitEvent, EventPriority];
  [BattleEvents.TeamRemoveUnit]: [TeamUnitEvent, EventPriority];
  [BattleEvents.TeamAddStatus]: [TeamStatusEvent, EventPriority];
  [BattleEvents.TeamRemoveStatus]: [TeamStatusEvent, EventPriority];

  [BattleEvents.AllianceAddTeam]: [AllianceTeamEvent, EventPriority];
  [BattleEvents.AllianceRemoveTeam]: [AllianceTeamEvent, EventPriority];

  // Field events
  [BattleEvents.SetWeather]: [WeatherEvent, EventPriority];
  [BattleEvents.AddAlliance]: [AllianceEvent, EventPriority];
  [BattleEvents.RemoveAlliance]: [AllianceEvent, EventPriority];
}

export interface CastingData {
  target: MoveTarget;
  progress: number;
  duration: number;
}

export interface CooldownData {
  progress: number;
  duration: number;
}
