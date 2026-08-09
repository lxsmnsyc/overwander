import type { BaseEvent, EventPriority } from '../core/event-emitter';
import type { EventMap } from '../core/event-engine';
import type { Stages, Stats, StatsKind } from '../data/constants/stats';
import type { Types } from '../data/constants/types';
import type Abilities from '../data/ids/abilities';
import type { Items } from '../data/ids/items';
import type { MoveCategories, MoveTargetPriorities, Moves } from '../data/ids/moves';
import type { Genders, Species } from '../data/ids/species';
import type { Statuses, TeamStatuses, Weathers } from '../data/ids/status';
import type Alliance from './alliance';
import type Team from './team';
import type Unit from './unit';

export const enum BattleEvents {
  // Core events
  Initialize = 0,
  Start = 1,
  End = 2,
  Tick = 3,

  // Cast events
  EnableMove = 4,
  DisableMove = 5,

  CheckUnitMoveType = 6,
  CheckUnitMoveImmunity = 7,
  CheckUnitMoveAccuracy = 8,
  CheckUnitMovePP = 9,
  CheckUnitMovePower = 10,
  CheckUnitMovePriority = 11,
  CheckUnitMoveCooldown = 12,
  CheckUnitMoveSteps = 13,

  CheckUnitMoveCastTime = 14,
  CheckUnitMoveChannelTime = 15,
  CheckUnitMoveDuration = 16,
  CheckUnitMoveDelay = 17,

  CheckUnitWeather = 18,
  CheckUnitStat = 19,
  CheckUnitStage = 20,

  CheckUnitEscape = 21,
  CheckUnitStatusImmunity = 22,
  CheckUnitRecoil = 23,

  CheckTypeEffectiveness = 24,

  ResolveUnitStat = 25,

  UnitInterrupt = 26,

  CheckUnitCanCast = 27,

  UnitCast = 28,
  UnitUpdateCast = 29,
  UnitFinishCast = 30,
  UnitStopCast = 31,

  UnitStartCooldown = 32,
  UnitFinishCooldown = 33,
  UnitUpdateCooldown = 34,

  CheckUnitCanChannel = 35,

  UnitChannel = 36,
  UnitUpdateChannel = 37,
  UnitFinishChannel = 38,
  UnitStopChannel = 39,

  UnitTriggerMove = 40,
  UnitTriggerMoveUpdate = 41,
  UnitTriggerMoveEnd = 42,
  UnitTriggerMoveTarget = 43,
  UnitTriggerMoveEffect = 44,

  UnitTriggerMoveResolveAccuracy = 45,
  UnitTriggerMoveRollHit = 46,

  UnitTriggerMoveMissed = 47,
  UnitTriggerMoveFailed = 48,
  UnitTriggerMoveEffectFailed = 49,

  // Damage events
  UnitAttack = 50,
  UnitAttackCheckCriticalRatio = 51,
  UnitAttackResolveCriticalChance = 52,
  UnitAttackResolveCriticalHit = 53,
  UnitAttackResolveDamage = 54,
  UnitAttackResolveStat = 55,
  UnitAttackResolveSTAB = 56,
  UnitAttackResolveCriticalMult = 57,
  UnitAttackResolveEffectiveness = 58,

  CheckUnitAttackEffect = 59,
  CheckUnitAttackEffectChance = 60,
  UnitAttackEffect = 61,

  UnitCure = 62,
  UnitHeal = 63,
  UnitDamage = 64,
  UnitFaints = 65,

  // Unit event
  UnitCreated = 66,

  UnitEntersField = 67,
  UnitLeavesField = 68,

  UnitSetStat = 69,
  UnitSetLevel = 70,
  UnitSetHealth = 71,
  UnitSetMaxHealth = 72,

  UnitAddType = 73,
  UnitRemoveType = 74,

  UnitAddStatus = 75,
  UnitRemoveStatus = 76,
  UnitTriggerStatus = 77,

  UnitAddStage = 78,
  UnitRemoveStage = 79,
  UnitCheckStage = 80,

  UnitAddMove = 81,
  UnitRemoveMove = 82,
  UnitEnableMove = 83,
  UnitDisableMove = 84,

  UnitAddItem = 85,
  UnitRemoveItem = 86,
  UnitTriggerItem = 87,
  UnitEnableItem = 88,
  UnitDisableItem = 89,

  UnitAddAbility = 90,
  UnitRemoveAbility = 91,
  UnitTriggerAbility = 92,
  UnitEnableAbility = 93,
  UnitDisableAbility = 94,

  UnitSwitch = 95,

  UnitSetSpecies = 96,
  UnitSetAppearance = 97,

  // Field events
  SetWeather = 98,
  SetTerrain = 99,

  // Side events
  TeamAddUnit = 100,
  TeamRemoveUnit = 101,
  TeamAddStatus = 102,
  TeamRemoveStatus = 103,
  TeamSetWeather = 104,

  CheckTeamStatusImmunity = 105,

  AllianceAddTeam = 106,
  AllianceRemoveTeam = 107,

  AddAlliance = 108,
  RemoveAlliance = 109,

  // AI events
  CheckUnitAIMoveScore = 110,
  UnitAIChooseMove = 111,
  CheckUnitAIRating = 112,
  CheckTeamAIUnit = 113,

  CheckUnitCanConsumeItem = 114,
  UnitSetGender = 115,
  UnitResetStages = 116,
  /**
   * A real status application was blocked by an immunity; unlike the
   * speculative CheckUnitStatusImmunity, this only fires on actual
   * attempts, so visual cues can hook it safely
   */
  UnitAddStatusFailed = 117,
  CheckUnitItemThreshold = 118,
  CheckUnitDrain = 119,
  CheckUnitAddStage = 120,
  CheckUnitRemoveStage = 121,
  CheckUnitStatusDuration = 122,
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

export interface CheckUnitMoveTimeEvent extends CheckUnitMoveEvent {
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

export interface UnitTriggerMoveUpdateEvent extends BaseEvent {
  data: Partial<TriggerMoveData>;
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

export interface CheckUnitStatusImmunityEvent extends UnitUpdateStatusEvent {
  immune: boolean;
}

export interface UnitTriggerMoveChildEvent extends BaseEvent {
  parent: UnitTriggerMoveEvent;
}

export interface UnitTriggerMoveResolveAccuracyEvent extends BaseEvent {
  parent: UnitTriggerMoveEvent;
  accuracy?: number;
}

export interface UnitTriggerMoveRollHitEvent extends BaseEvent {
  parent: UnitTriggerMoveEvent;
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

/**
 * How long a timed status holds the unit; listeners (e.g. Early
 * Bird) adjust the duration in milliseconds
 */
export interface CheckUnitStatusDurationEvent extends UnitStatusEvent {
  duration: number;
}

/**
 * Whether the stage change may apply; blockers (e.g. Clear Body,
 * Keen Eye, a substitute) veto it here instead of disabling the
 * update event
 */
export interface CheckUnitUpdateStageEvent extends UnitUpdateStageEvent {
  success: boolean;
}

export interface UnitDamageEvent extends UnitEvent {
  target: Unit;
  value: number;
  flags: number;
  cause: EffectCause;
  success: boolean;
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

  success: boolean;
}

export interface UnitAttackChildEvent extends BaseEvent {
  parent: UnitAttackEvent;
}

export interface UnitAttackResolveEffectivenessEvent extends UnitAttackChildEvent {
  defendingType: Types;
  multiplier: number;
}

export interface UnitAttackResolveAmountEvent extends UnitAttackChildEvent {
  value: number;
}

export interface UnitAttackResolveCriticalEvent extends UnitAttackChildEvent {
  critical: boolean;
}

export interface UnitAttackResolveStatEvent extends UnitAttackResolveAmountEvent {
  stat: Stats;
  /**
   * The unit whose stat is being resolved (the attacker for the
   * offensive stat, the target for the defensive stat)
   */
  unit: Unit;
}

export interface CheckUnitAttackEffectEvent extends UnitAttackChildEvent {
  success: boolean;
}

export interface CheckUnitAttackEffectChanceEvent extends UnitAttackChildEvent {
  value?: number;
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

export interface CheckUnitCanConsumeItemEvent extends UnitEvent {
  item: Items;
  success: boolean;
}

export interface UnitItemEvent extends UnitEvent {
  item: Items;
}

/**
 * The health fraction at (or below) which the unit consumes a pinch
 * item; listeners (e.g. Gluttony) adjust it
 */
export interface CheckUnitItemThresholdEvent extends UnitItemEvent {
  threshold: number;
}

/**
 * Health drained by the source from the target; listeners adjust the
 * amount — a negative value hurts the drainer instead (Liquid Ooze)
 */
export interface CheckUnitDrainEvent extends UnitEvent {
  target: Unit;
  value: number;
}

export interface UnitSwitchEvent extends UnitEvent {
  target: Unit;
}

export interface CheckUnitRecoilEvent extends BaseEvent {
  parent: UnitDamageEvent;
  recoil: boolean;
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

export interface CheckTeamStatusImmunityEvent extends TeamUpdateStatusEvent {
  immune: boolean;
}

export interface UnitCureEvent extends UnitEvent {
  cause: EffectCause;
}

export interface UnitSpeciesEvent extends UnitEvent {
  species: Species;
}

export interface UnitSetGenderEvent extends UnitEvent {
  gender: Genders;
}

export interface UnitResetStagesEvent extends UnitEvent {
  cause: EffectCause;
}

export interface CheckUnitAIMoveScoreEvent extends UnitMoveEvent {
  target: MoveTarget;
  score: number;
}

export interface AIMoveChoice {
  move: Moves;
  target: MoveTarget;
  score: number;
}

export interface UnitAIChooseMoveEvent extends UnitEvent {
  choice?: AIMoveChoice;
}

export interface CheckUnitAIRatingEvent extends UnitEvent {
  /**
   * How strong the unit currently is: resolved stats with stages
   * applied, adjusted by statuses and remaining health
   */
  rating: number;
}

export interface CheckTeamAIUnitEvent extends TeamEvent {
  priority: MoveTargetPriorities;
  /**
   * Unit to leave out of consideration (e.g. the one switching out)
   */
  exclude?: Unit;
  unit?: Unit;
}

export interface BattleEventMap extends EventMap {
  [BattleEvents.Initialize]: [BaseEvent, EventPriority];
  [BattleEvents.Start]: [BaseEvent, EventPriority];
  [BattleEvents.End]: [BaseEvent, EventPriority];
  [BattleEvents.Tick]: [TickEvent, EventPriority];

  // Checks
  [BattleEvents.CheckUnitMoveType]: [CheckUnitMoveTypeEvent, EventPriority];
  [BattleEvents.CheckUnitMoveAccuracy]: [CheckUnitMoveAccuracyEvent, EventPriority];
  [BattleEvents.CheckUnitMoveImmunity]: [CheckUnitMoveImmunityEvent, EventPriority];
  [BattleEvents.CheckUnitMovePP]: [CheckUnitMovePPEvent, EventPriority];
  [BattleEvents.CheckUnitMovePower]: [CheckUnitMovePowerEvent, EventPriority];
  [BattleEvents.CheckUnitMovePriority]: [CheckUnitMovePriorityEvent, EventPriority];
  [BattleEvents.CheckUnitMoveCooldown]: [CheckUnitMoveTimeEvent, EventPriority];
  [BattleEvents.CheckUnitMoveSteps]: [CheckUnitMoveStepsEvent, EventPriority];
  [BattleEvents.CheckUnitMoveCastTime]: [CheckUnitMoveTimeEvent, EventPriority];
  [BattleEvents.CheckUnitMoveChannelTime]: [CheckUnitMoveTimeEvent, EventPriority];
  [BattleEvents.CheckUnitMoveDuration]: [CheckUnitMoveTimeEvent, EventPriority];
  [BattleEvents.CheckUnitMoveDelay]: [CheckUnitMoveTimeEvent, EventPriority];

  [BattleEvents.CheckUnitStat]: [CheckUnitStatEvent, EventPriority];
  [BattleEvents.CheckUnitStage]: [CheckUnitStageEvent, EventPriority];
  [BattleEvents.CheckUnitEscape]: [CheckUnitEscapeEvent, EventPriority];
  [BattleEvents.CheckUnitStatusImmunity]: [CheckUnitStatusImmunityEvent, EventPriority];
  [BattleEvents.CheckUnitRecoil]: [CheckUnitRecoilEvent, EventPriority];

  [BattleEvents.ResolveUnitStat]: [CheckUnitStatEvent, EventPriority];

  // Unit events
  [BattleEvents.UnitAddStatus]: [UnitUpdateStatusEvent, EventPriority];
  [BattleEvents.UnitAddStatusFailed]: [UnitUpdateStatusEvent, EventPriority];
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
  [BattleEvents.UnitAttackCheckCriticalRatio]: [UnitAttackResolveAmountEvent, EventPriority];
  [BattleEvents.UnitAttackResolveCriticalChance]: [UnitAttackResolveAmountEvent, EventPriority];
  [BattleEvents.UnitAttackResolveCriticalHit]: [UnitAttackResolveCriticalEvent, EventPriority];
  [BattleEvents.UnitAttackResolveDamage]: [UnitAttackResolveAmountEvent, EventPriority];
  [BattleEvents.UnitAttackResolveStat]: [UnitAttackResolveStatEvent, EventPriority];
  [BattleEvents.UnitAttackResolveSTAB]: [UnitAttackResolveAmountEvent, EventPriority];
  [BattleEvents.UnitAttackResolveCriticalMult]: [UnitAttackResolveAmountEvent, EventPriority];
  [BattleEvents.UnitAttackResolveEffectiveness]: [
    UnitAttackResolveEffectivenessEvent,
    EventPriority,
  ];

  [BattleEvents.CheckUnitAttackEffect]: [CheckUnitAttackEffectEvent, EventPriority];
  [BattleEvents.CheckUnitAttackEffectChance]: [CheckUnitAttackEffectChanceEvent, EventPriority];
  [BattleEvents.UnitAttackEffect]: [UnitAttackChildEvent, EventPriority];

  [BattleEvents.UnitHeal]: [UnitHealEvent, EventPriority];
  [BattleEvents.UnitDamage]: [UnitDamageEvent, EventPriority];
  [BattleEvents.UnitFaints]: [UnitFaintsEvent, EventPriority];
  [BattleEvents.UnitCure]: [UnitCureEvent, EventPriority];

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
  [BattleEvents.UnitTriggerMoveUpdate]: [UnitTriggerMoveUpdateEvent, EventPriority];
  [BattleEvents.UnitTriggerMoveEnd]: [UnitTriggerMoveEvent, EventPriority];

  [BattleEvents.UnitTriggerMoveTarget]: [UnitTriggerMoveEvent, EventPriority];
  [BattleEvents.UnitTriggerMoveEffect]: [UnitTriggerMoveEvent, EventPriority];
  [BattleEvents.UnitTriggerMoveEffectFailed]: [UnitTriggerMoveEvent, EventPriority];

  [BattleEvents.UnitTriggerMoveResolveAccuracy]: [
    UnitTriggerMoveResolveAccuracyEvent,
    EventPriority,
  ];
  [BattleEvents.UnitTriggerMoveRollHit]: [UnitTriggerMoveRollHitEvent, EventPriority];
  [BattleEvents.UnitTriggerMoveMissed]: [UnitTriggerMoveChildEvent, EventPriority];
  [BattleEvents.UnitTriggerMoveFailed]: [UnitTriggerMoveChildEvent, EventPriority];

  [BattleEvents.CheckUnitWeather]: [UnitWeatherEvent, EventPriority];

  [BattleEvents.UnitSetSpecies]: [UnitSpeciesEvent, EventPriority];
  [BattleEvents.UnitSetAppearance]: [UnitSpeciesEvent, EventPriority];
  [BattleEvents.UnitSetGender]: [UnitSetGenderEvent, EventPriority];
  [BattleEvents.UnitResetStages]: [UnitResetStagesEvent, EventPriority];

  // Team events
  [BattleEvents.TeamAddUnit]: [TeamUnitEvent, EventPriority];
  [BattleEvents.TeamRemoveUnit]: [TeamUnitEvent, EventPriority];
  [BattleEvents.TeamAddStatus]: [TeamUpdateStatusEvent, EventPriority];
  [BattleEvents.TeamRemoveStatus]: [TeamUpdateStatusEvent, EventPriority];
  [BattleEvents.TeamSetWeather]: [TeamWeatherEvent, EventPriority];

  [BattleEvents.CheckTeamStatusImmunity]: [CheckTeamStatusImmunityEvent, EventPriority];

  [BattleEvents.AllianceAddTeam]: [AllianceTeamEvent, EventPriority];
  [BattleEvents.AllianceRemoveTeam]: [AllianceTeamEvent, EventPriority];

  // Field events
  [BattleEvents.SetWeather]: [WeatherEvent, EventPriority];
  [BattleEvents.AddAlliance]: [AllianceEvent, EventPriority];
  [BattleEvents.RemoveAlliance]: [AllianceEvent, EventPriority];

  // AI events
  [BattleEvents.CheckUnitAIMoveScore]: [CheckUnitAIMoveScoreEvent, EventPriority];
  [BattleEvents.UnitAIChooseMove]: [UnitAIChooseMoveEvent, EventPriority];
  [BattleEvents.CheckUnitAIRating]: [CheckUnitAIRatingEvent, EventPriority];
  [BattleEvents.CheckTeamAIUnit]: [CheckTeamAIUnitEvent, EventPriority];
  [BattleEvents.CheckUnitCanConsumeItem]: [CheckUnitCanConsumeItemEvent, EventPriority];
  [BattleEvents.CheckUnitItemThreshold]: [CheckUnitItemThresholdEvent, EventPriority];
  [BattleEvents.CheckUnitDrain]: [CheckUnitDrainEvent, EventPriority];
  [BattleEvents.CheckUnitStatusDuration]: [CheckUnitStatusDurationEvent, EventPriority];
  [BattleEvents.CheckUnitAddStage]: [CheckUnitUpdateStageEvent, EventPriority];
  [BattleEvents.CheckUnitRemoveStage]: [CheckUnitUpdateStageEvent, EventPriority];
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

export interface TriggerMoveData {
  parent: UnitTriggerMoveEvent;
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
