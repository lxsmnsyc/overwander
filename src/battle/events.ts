import type { BaseEvent, EventPriority } from '../core/event-emitter';
import type { EventMap } from '../core/event-engine';
import type { Stages, Stats, StatsKind } from '../data/constants/stats';
import type { Types } from '../data/constants/types';
import type { Abilities } from '../data/ids/abilities';
import type { Items } from '../data/ids/items';
import type { MoveCategories, Moves } from '../data/ids/moves';
import type { Statuses, TeamStatuses, Weathers } from '../data/ids/status';
import type { Alliance } from './alliance';
import type { Team } from './team';
import type { Unit } from './unit';

export const enum BattleEvents {
  // Core events
  Initialize,
  Start,
  End,
  Tick,

  // Cast events
  EnableMove,
  DisableMove,

  CheckUnitMoveType,
  CheckUnitMoveImmunity,
  CheckUnitMoveAccuracy,
  CheckUnitMovePP,
  CheckUnitMovePower,
  CheckUnitMovePriority,
  CheckUnitMoveCooldown,
  CheckUnitMoveSteps,

  CheckUnitWeather,
  CheckUnitStat,
  CheckUnitStage,

  CheckUnitEscape,
  CheckUnitStatusImmunity,

  CheckTypeEffectiveness,

  ResolveUnitStat,

  UnitInterrupt,

  CheckUnitCanCast,

  UnitCast,
  UnitUpdateCast,
  UnitFinishCast,
  UnitStopCast,

  UnitStartCooldown,
  UnitFinishCooldown,
  UnitUpdateCooldown,

  CheckUnitCanChannel,

  UnitChannel,
  UnitUpdateChannel,
  UnitFinishChannel,
  UnitStopChannel,

  UnitTriggerMove,
  UnitTriggerMoveTarget,
  UnitTriggerMoveEffect,

  UnitTriggerMoveResolveAccuracy,
  UnitTriggerMoveRollHit,

  UnitTriggerMoveMissed,
  UnitTriggerMoveFailed,

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

  UnitHeal,
  UnitDamage,
  UnitFaints,

  // Unit event
  UnitCreated,

  UnitEntersField,
  UnitLeavesField,

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
  UnitEnableMove,
  UnitDisableMove,

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

  UnitSwitch,

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

export const enum EffectType {
  None = 0,
  Move = 1,
  Ability = 2,
  Item = 3,
}

export type EffectCause =
  | { type: EffectType.Move; move: Moves; unit: Unit }
  | { type: EffectType.Item; item: Items; unit: Unit }
  | { type: EffectType.Ability; ability: Abilities; unit: Unit }
  | { type: EffectType.None };

export interface TickEvent extends BaseEvent {
  duration: number;
}

export interface WeatherEvent extends BaseEvent {
  weather: Weathers;
}

export interface UnitEvent extends BaseEvent {
  source: Unit;
}

export interface UnitMoveEvent extends UnitEvent {
  move: Moves;
}

export interface UnitCastEvent extends UnitMoveEvent {
  target: MoveTarget;
}

export interface CheckUnitCanCastEvent extends UnitCastEvent {
  success: boolean;
}

export interface UnitUpdateCastEvent extends UnitEvent {
  data: Partial<CastingData>;
}

export interface UnitUpdateCooldownEvent extends UnitMoveEvent {
  data: Partial<ProgressData>;
}

export interface CheckUnitMoveEvent extends UnitMoveEvent {
  target: MoveTarget;
}

export interface CheckUnitMoveTypeEvent extends CheckUnitMoveEvent {
  type: Types;
}

export interface CheckUnitMoveImmunityEvent extends CheckUnitMoveTypeEvent {
  immune: boolean;
}

export interface CheckUnitMoveAccuracyEvent extends CheckUnitMoveEvent {
  accuracy?: number;
}

export interface CheckUnitMovePPEvent extends CheckUnitMoveEvent {
  pp: number;
}

export interface CheckUnitMovePowerEvent extends CheckUnitMoveEvent {
  power?: number;
}

export interface CheckUnitMovePriorityEvent extends CheckUnitMoveEvent {
  priority: number;
}

export interface CheckUnitMoveCooldownEvent extends CheckUnitMoveEvent {
  duration: number;
}

export interface CheckUnitMoveStepsEvent extends CheckUnitMoveEvent {
  steps: number;
}

export interface UnitChannelEvent extends UnitCastEvent {
  steps: number;
}

export interface CheckUnitCanChannelEvent extends UnitChannelEvent {
  success: boolean;
}

export interface UnitUpdateChannelEvent extends UnitEvent {
  data: Partial<ChannelingData>;
}

export interface UnitTriggerMoveEvent extends UnitCastEvent {
  steps: number;
}

export interface UnitStatEvent extends UnitEvent {
  stat: Stats;
  value: number;
}

export interface CheckUnitStatEvent extends UnitStatEvent {
  flags: number;
}

export interface UnitSetStatEvent extends UnitStatEvent {
  kind: StatsKind;
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

export interface UnitSetValueEvent extends UnitEvent {
  value: number;
}

export interface UnitTypeEvent extends UnitEvent {
  type: Types;
}

export interface UnitStatusEvent extends UnitEvent {
  status: Statuses;
}

export interface UnitUpdateStatusEvent extends UnitStatusEvent {
  cause: EffectCause;
}

export interface UnitTriggerMoveChildEvent extends BaseEvent {
  parent: UnitTriggerMoveEvent;
}

export interface UnitTriggerMoveResolveAccuracyEvent extends BaseEvent {
  parent: UnitTriggerMoveEvent;
  accuracy: number;
}

export interface UnitTriggerMoveRollHitEvent
  extends UnitTriggerMoveResolveAccuracyEvent {
  hit: boolean;
}

export interface UnitWeatherEvent extends UnitEvent {
  weather: Weathers;
}

export interface UnitStageEvent extends UnitEvent {
  stage: Stages;
  value: number;
}

export interface UnitUpdateStageEvent extends UnitStageEvent {
  cause: EffectCause;
}

export interface TeamEvent extends BaseEvent {
  team: Team;
}

export interface TeamStatusEvent extends TeamEvent {
  status: TeamStatuses;
}

export interface TeamUpdateStatusEvent extends TeamStatusEvent {
  cause: EffectCause;
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
  cause: EffectCause;
}

export interface UnitHealEvent extends UnitEvent {
  target: Unit;
  value: number;
  flags: number;
  cause: EffectCause;
}

export interface UnitFaintsEvent extends UnitEvent {
  attacker: Unit;
}

export interface UnitAttackEvent extends UnitEvent {
  target: Unit;
  value: number;
  flags: number;

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

export interface UnitSwitchEvent extends UnitEvent {
  target: Unit;
}

export interface CheckUnitStatusImmunityEvent extends UnitUpdateStatusEvent {
  immune: boolean;
}

export interface BattleEventMap extends EventMap {
  [BattleEvents.Initialize]: [BaseEvent, EventPriority];
  [BattleEvents.Start]: [BaseEvent, EventPriority];
  [BattleEvents.End]: [BaseEvent, EventPriority];
  [BattleEvents.Tick]: [TickEvent, EventPriority];

  // Checks
  [BattleEvents.CheckUnitMoveType]: [CheckUnitMoveTypeEvent, EventPriority];
  [BattleEvents.CheckUnitMoveAccuracy]: [
    CheckUnitMoveAccuracyEvent,
    EventPriority,
  ];
  [BattleEvents.CheckUnitMoveImmunity]: [
    CheckUnitMoveImmunityEvent,
    EventPriority,
  ];
  [BattleEvents.CheckUnitMovePP]: [CheckUnitMovePPEvent, EventPriority];
  [BattleEvents.CheckUnitMovePower]: [CheckUnitMovePowerEvent, EventPriority];
  [BattleEvents.CheckUnitMovePriority]: [
    CheckUnitMovePriorityEvent,
    EventPriority,
  ];
  [BattleEvents.CheckUnitMoveCooldown]: [
    CheckUnitMoveCooldownEvent,
    EventPriority,
  ];
  [BattleEvents.CheckUnitMoveSteps]: [CheckUnitMoveStepsEvent, EventPriority];

  [BattleEvents.CheckUnitStat]: [CheckUnitStatEvent, EventPriority];
  [BattleEvents.CheckUnitStage]: [CheckUnitStageEvent, EventPriority];
  [BattleEvents.CheckUnitEscape]: [CheckUnitEscapeEvent, EventPriority];
  [BattleEvents.CheckUnitStatusImmunity]: [
    CheckUnitStatusImmunityEvent,
    EventPriority,
  ];

  [BattleEvents.ResolveUnitStat]: [CheckUnitStatEvent, EventPriority];

  // Unit events
  [BattleEvents.UnitAddStatus]: [UnitUpdateStatusEvent, EventPriority];
  [BattleEvents.UnitRemoveStatus]: [UnitUpdateStatusEvent, EventPriority];
  [BattleEvents.UnitTriggerStatus]: [UnitUpdateStatusEvent, EventPriority];

  [BattleEvents.UnitSetLevel]: [UnitSetValueEvent, EventPriority];
  [BattleEvents.UnitSetHealth]: [UnitSetValueEvent, EventPriority];
  [BattleEvents.UnitSetStat]: [UnitSetStatEvent, EventPriority];

  [BattleEvents.UnitAddType]: [UnitTypeEvent, EventPriority];
  [BattleEvents.UnitRemoveType]: [UnitTypeEvent, EventPriority];

  [BattleEvents.UnitAddStage]: [UnitUpdateStageEvent, EventPriority];
  [BattleEvents.UnitRemoveStage]: [UnitUpdateStageEvent, EventPriority];
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

  [BattleEvents.UnitHeal]: [UnitHealEvent, EventPriority];
  [BattleEvents.UnitDamage]: [UnitDamageEvent, EventPriority];
  [BattleEvents.UnitFaints]: [UnitFaintsEvent, EventPriority];
  [BattleEvents.UnitEntersField]: [UnitEvent, EventPriority];
  [BattleEvents.UnitLeavesField]: [UnitEvent, EventPriority];
  [BattleEvents.UnitSwitch]: [UnitSwitchEvent, EventPriority];
  [BattleEvents.UnitInterrupt]: [UnitEvent, EventPriority];

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
  [BattleEvents.UnitEnableMove]: [UnitMoveEvent, EventPriority];
  [BattleEvents.UnitDisableMove]: [UnitMoveEvent, EventPriority];

  // Casting events
  [BattleEvents.CheckUnitCanCast]: [CheckUnitCanCastEvent, EventPriority];
  [BattleEvents.UnitCast]: [UnitCastEvent, EventPriority];
  [BattleEvents.UnitUpdateCast]: [UnitUpdateCastEvent, EventPriority];
  [BattleEvents.UnitStopCast]: [UnitEvent, EventPriority];
  [BattleEvents.UnitFinishCast]: [UnitEvent, EventPriority];

  [BattleEvents.UnitStartCooldown]: [UnitCastEvent, EventPriority];
  [BattleEvents.UnitUpdateCooldown]: [UnitUpdateCooldownEvent, EventPriority];
  [BattleEvents.UnitFinishCooldown]: [UnitMoveEvent, EventPriority];

  [BattleEvents.CheckUnitCanChannel]: [CheckUnitCanChannelEvent, EventPriority];
  [BattleEvents.UnitChannel]: [UnitChannelEvent, EventPriority];
  [BattleEvents.UnitUpdateChannel]: [UnitUpdateChannelEvent, EventPriority];
  [BattleEvents.UnitStopChannel]: [UnitEvent, EventPriority];
  [BattleEvents.UnitFinishChannel]: [UnitEvent, EventPriority];

  [BattleEvents.UnitTriggerMove]: [UnitTriggerMoveEvent, EventPriority];
  [BattleEvents.UnitTriggerMoveTarget]: [UnitTriggerMoveEvent, EventPriority];
  [BattleEvents.UnitTriggerMoveEffect]: [UnitTriggerMoveEvent, EventPriority];

  [BattleEvents.UnitTriggerMoveResolveAccuracy]: [
    UnitTriggerMoveResolveAccuracyEvent,
    EventPriority,
  ];
  [BattleEvents.UnitTriggerMoveRollHit]: [
    UnitTriggerMoveRollHitEvent,
    EventPriority,
  ];
  [BattleEvents.UnitTriggerMoveMissed]: [
    UnitTriggerMoveChildEvent,
    EventPriority,
  ];
  [BattleEvents.UnitTriggerMoveFailed]: [
    UnitTriggerMoveChildEvent,
    EventPriority,
  ];

  [BattleEvents.CheckUnitWeather]: [UnitWeatherEvent, EventPriority];

  // Team events
  [BattleEvents.TeamAddUnit]: [TeamUnitEvent, EventPriority];
  [BattleEvents.TeamRemoveUnit]: [TeamUnitEvent, EventPriority];
  [BattleEvents.TeamAddStatus]: [TeamStatusEvent, EventPriority];
  [BattleEvents.TeamRemoveStatus]: [TeamStatusEvent, EventPriority];
  [BattleEvents.TeamSetWeather]: [TeamWeatherEvent, EventPriority];

  [BattleEvents.AllianceAddTeam]: [AllianceTeamEvent, EventPriority];
  [BattleEvents.AllianceRemoveTeam]: [AllianceTeamEvent, EventPriority];

  // Field events
  [BattleEvents.SetWeather]: [WeatherEvent, EventPriority];
  [BattleEvents.AddAlliance]: [AllianceEvent, EventPriority];
  [BattleEvents.RemoveAlliance]: [AllianceEvent, EventPriority];
}

export interface ProgressData {
  progress: number;
  duration: number;
}

export interface CastingData {
  move: Moves;
  target: MoveTarget;
  time: ProgressData;
}

export interface MoveState {
  move: Moves;
  source: Unit;
  disabled: boolean;
  cooldown?: ProgressData;
}

export interface ChannelingData extends CastingData {
  steps: number;
}
