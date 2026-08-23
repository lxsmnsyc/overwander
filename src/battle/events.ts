import type { AttackPriority, BaseEvent, EventPriority } from '../core/event-emitter';
import type { EventMap } from '../core/event-engine';
import type { Stages, Stats, StatsKind } from '../data/constants/stats';
import type { Types } from '../data/constants/types';
import type Abilities from '../data/ids/abilities';
import type { Items } from '../data/ids/items';
import type { MoveCategories, MoveTargetPriorities, Moves } from '../data/ids/moves';
import type Natures from '../data/ids/natures';
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
  /**
   * Whether a stage change may land at all: the verdict every guard
   * against being weakened answers — Clear Body, a Mist, a Guard Spec.
   * A drop is a negative on the add side and a positive on the remove
   * one, which is the same difference the applied events carry.
   *
   * Asked only on real attempts, never speculatively, so an item may
   * be spent answering one
   */
  CheckUnitCanAddStage = 120,
  CheckUnitCanRemoveStage = 121,
  CheckUnitStatusDuration = 122,
  UnitUpdateStatusTimer = 123,
  CheckUnitMoveHits = 124,
  CheckUnitGrounded = 125,
  CheckUnitMoveTargetFlags = 126,
  UnitSetWeather = 127,
  CheckUnitAbility = 128,
  UnitSetNature = 129,
  UnitSetHeight = 130,
  UnitSetWeight = 131,
  /**
   * Whether damage may land on the unit at all. It is the question a
   * blanket immunity answers — a Boss shrugging off everything
   * indirect, Magic Guard, an ability that ignores its weather's chip
   * — asked once before the damage is emitted, so an immunity is a
   * verdict rather than a race to disable the event first
   */
  CheckUnitCanDamage = 132,
  /**
   * Whether a move the AI is considering would actually do something
   * against a given target. It is asked before the move is scored, so
   * a move whose prerequisite is unmet (Dream Eater on somebody awake,
   * Counter with nothing to return) is never picked at all rather than
   * picked and then failed on trigger
   */
  CheckUnitAIMoveUsable = 133,
  /**
   * How many points have been spent on one of the unit's moves — what
   * a PP Up bought. It is set when the unit is fielded, from the
   * record it was copied out of, and read by `CheckUnitMovePP` to say
   * how quickly the move comes back
   */
  UnitSetMovePoints = 134,

  /**
   * How long a team status holds, the team-wide twin of
   * CheckUnitStatusDuration: it is what a Light Clay lengthens a
   * screen by
   */
  CheckTeamStatusDuration = 135,

  /**
   * How long weather a unit calls up stays out. It is what the
   * weather rocks lengthen
   */
  CheckUnitWeatherDuration = 136,

  /**
   * What a unit weighs right now, in kilograms. The stored weight is
   * the individual's own; this is what anything reading it sees, so a
   * Float Stone lightens its holder without touching the record
   */
  CheckUnitWeight = 137,

  /**
   * Whether a blow counts as contact against the one it lands on. It
   * is what every reaction to being touched reads — a Rocky Helmet, a
   * Static, a Sticky Barb — so a pair of Protective Pads answers all
   * of them once
   */
  CheckUnitMoveContact = 138,

  /**
   * A fainted unit put back on its feet. The only thing that does it
   * is a Sacred Ash, and it is an event rather than a flag flipped
   * from outside so the field can be told: `value` is the health it
   * comes back on
   */
  UnitRevives = 139,

  /**
   * How much room the unit has for abilities, items and moves, packed
   * as the catch record packs it. It is fielded from the record rather
   * than decided by the battle
   */
  UnitSetSlots = 140,
  /**
   * Whether health may go back on the unit at all. The mirror of
   * `CheckUnitCanDamage`, asked once before the heal is emitted: a
   * raid boss whose pool is the fight's timer answers no, and so would
   * a Heal Block or a wound that will not close
   */
  CheckUnitCanHeal = 141,
  UnitUpdateSwitch = 142,
  UnitFinishSwitch = 143,
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
  Weather = 4,
}

export type EffectCause =
  | { type: EffectType.Move; move: Moves; unit: Unit }
  | { type: EffectType.Item; item: Items; unit: Unit }
  | { type: EffectType.Ability; ability: Abilities; unit: Unit }
  // Environmental damage: `unit` is the afflicted unit itself
  | { type: EffectType.Weather; weather: Weathers; unit: Unit }
  | { type: EffectType.None };

export interface TickEvent extends BaseEvent {
  duration: number;
}

export interface WeatherEvent extends BaseEvent {
  weather: Weathers;
  /**
   * How long it stays out, in milliseconds. Zero is weather with no
   * clock on it at all — what a battle opens under, and what clearing
   * the sky sets
   */
  duration: number;
}

export interface UnitEvent extends BaseEvent {
  source: Unit;
}

export interface UnitEntersFieldEvent extends UnitEvent {
  /**
   * True when this is not a genuine entry but an ability
   * re-activation (e.g. Neutralizing Gas lifting). Entry abilities
   * fire either way; one-time entry side-effects (hazards, dormancy)
   * must skip reactivations.
   */
  reactivation: boolean;
}

export interface UnitMoveEvent extends UnitEvent {
  move: Moves;
}

export interface UnitMovePointsEvent extends UnitMoveEvent {
  points: number;
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

/**
 * Resolves how many times a multi-hit move strikes: `hits` starts at
 * the rolled count and listeners (e.g. Skill Link) may adjust it up
 * to `max`
 */
export interface CheckUnitMoveHitsEvent extends CheckUnitMoveEvent {
  hits: number;
  max: number;
}

/**
 * Resolves whether the unit stands on the ground; airborne traits
 * (Floating status, Flying type, Levitate) clear it and the Grounded
 * status forces it back
 */
export interface CheckUnitGroundedEvent extends UnitEvent {
  grounded: boolean;
}

/**
 * Resolves the effective MoveTargetFlags mask a move uses when its
 * targets resolve; listeners (e.g. Boss) may widen it
 */
export interface CheckUnitMoveTargetFlagsEvent extends UnitMoveEvent {
  flags: number;
}

/**
 * A weather change originating from a unit. `global` decides whether
 * it lands on the whole battle or just the unit's own team — the
 * default follows the battle mode, and listeners (e.g. Boss) may
 * widen it
 */
export interface UnitSetWeatherEvent extends UnitEvent {
  weather: Weathers;
  global: boolean;
  duration: number;
}

/**
 * How long the weather a unit is calling up stays out; the rocks
 * lengthen it here
 */
export interface CheckUnitWeatherDurationEvent extends UnitWeatherEvent {
  duration: number;
}

export interface CheckUnitWeightEvent extends UnitEvent {
  weight: number;
}

export interface CheckUnitMoveContactEvent extends CheckUnitMoveEvent {
  contact: boolean;
}

/**
 * Resolves whether the unit can currently use an ability: `enabled`
 * starts from the unit's own ability record and suppressors (e.g.
 * Neutralizing Gas) may clear it
 */
export interface CheckUnitAbilityEvent extends UnitEvent {
  ability: Abilities;
  enabled: boolean;
}

export interface UnitSetNatureEvent extends UnitEvent {
  nature: Natures;
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

/**
 * The speculative form of a damage event: same shape, asked before
 * anything lands. A listener that says no stops the damage outright,
 * so nothing here should change the battle — the damage may yet be
 * refused by somebody else
 */
export interface CheckUnitCanDamageEvent extends UnitEvent {
  target: Unit;
  value: number;
  flags: number;
  cause: EffectCause;
  /**
   * Whether the damage may land. Opens true; a listener answering
   * false is an immunity
   */
  success: boolean;
}

/**
 * The speculative form of a heal: same shape, asked before anything
 * lands. A listener that says no stops the heal outright, so nothing
 * here should change the battle — the heal may yet be refused by
 * somebody else
 */
export interface CheckUnitCanHealEvent extends UnitEvent {
  target: Unit;
  value: number;
  flags: number;
  cause: EffectCause;
  /**
   * Whether the health may go back on. Opens true; a listener
   * answering false is a wound that will not close
   */
  success: boolean;
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
 * Bird) adjust the duration in milliseconds.
 *
 * The cause rides along because some of what adjusts a duration
 * belongs to whoever inflicted it rather than to whoever is holding
 * it — a Grip Claw is held by the one doing the binding
 */
export interface CheckUnitStatusDurationEvent extends UnitStatusEvent {
  duration: number;
  cause: EffectCause;
}

/**
 * How long a team status holds, in milliseconds. The cause carries
 * the unit that put it up, which is the one a Light Clay is held by
 */
export interface CheckTeamStatusDurationEvent extends TeamStatusEvent {
  duration: number;
  cause: EffectCause;
}

/**
 * A timed status advanced, structured like UnitUpdateCast: emitted
 * every tick with the new progress so visual cues can render it, and
 * authoritative — the timed status applies the data on Exact
 */
export interface UnitUpdateStatusTimerEvent extends UnitStatusEvent {
  data: Partial<ProgressData>;
}

/**
 * Whether the stage change may apply; blockers (e.g. Clear Body,
 * Keen Eye, a substitute) veto it here instead of disabling the
 * update event
 */
export interface CheckUnitCanUpdateStageEvent extends UnitUpdateStageEvent {
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

export interface UnitRemoveItemEvent extends UnitItemEvent {
  cause: EffectCause;
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

/**
 * A switch advanced, structured like UnitUpdateCast: emitted every
 * tick while the pair walk to each other's spots, authoritative on
 * Exact so external code can fast-forward it
 */
export interface UnitUpdateSwitchEvent extends UnitEvent {
  target: Unit;
  data: Partial<ProgressData>;
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
  duration: number;
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

/**
 * The speculative form of a move use: would this move, against this
 * target, do anything at all?
 *
 * Every effect that can refuse a move on trigger — an immunity, an
 * unmet prerequisite, a target already carrying what the move would
 * apply — answers here too, next to the refusal itself, so the two
 * cannot drift apart. Nothing here may change the battle: it is a
 * question asked of a move that has not been used
 */
export interface CheckUnitAIMoveUsableEvent extends UnitMoveEvent {
  target: MoveTarget;
  /**
   * Whether the move would do something. Opens true; a listener
   * answering false takes the move out of the running entirely
   */
  usable: boolean;
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
  [BattleEvents.CheckUnitMoveHits]: [CheckUnitMoveHitsEvent, EventPriority];
  [BattleEvents.CheckUnitGrounded]: [CheckUnitGroundedEvent, EventPriority];
  [BattleEvents.CheckUnitWeight]: [CheckUnitWeightEvent, EventPriority];
  [BattleEvents.CheckUnitMoveContact]: [CheckUnitMoveContactEvent, EventPriority];
  [BattleEvents.UnitRevives]: [UnitSetValueEvent, EventPriority];
  [BattleEvents.UnitSetSlots]: [UnitSetValueEvent, EventPriority];
  [BattleEvents.CheckUnitMoveTargetFlags]: [CheckUnitMoveTargetFlagsEvent, EventPriority];
  [BattleEvents.UnitSetWeather]: [UnitSetWeatherEvent, EventPriority];
  [BattleEvents.CheckUnitAbility]: [CheckUnitAbilityEvent, EventPriority];
  [BattleEvents.CheckUnitMoveCastTime]: [CheckUnitMoveTimeEvent, EventPriority];
  [BattleEvents.CheckUnitMoveChannelTime]: [CheckUnitMoveTimeEvent, EventPriority];
  [BattleEvents.CheckUnitMoveDuration]: [CheckUnitMoveTimeEvent, EventPriority];
  [BattleEvents.CheckUnitMoveDelay]: [CheckUnitMoveTimeEvent, EventPriority];

  [BattleEvents.CheckUnitStat]: [CheckUnitStatEvent, EventPriority];
  [BattleEvents.CheckUnitStage]: [CheckUnitStageEvent, EventPriority];
  [BattleEvents.CheckUnitEscape]: [CheckUnitEscapeEvent, EventPriority];
  [BattleEvents.CheckUnitStatusImmunity]: [CheckUnitStatusImmunityEvent, EventPriority];
  [BattleEvents.CheckUnitCanDamage]: [CheckUnitCanDamageEvent, EventPriority];
  [BattleEvents.CheckUnitCanHeal]: [CheckUnitCanHealEvent, EventPriority];
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

  [BattleEvents.UnitAttack]: [UnitAttackEvent, AttackPriority];
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
  [BattleEvents.UnitDamage]: [UnitDamageEvent, AttackPriority];
  [BattleEvents.UnitFaints]: [UnitFaintsEvent, EventPriority];
  [BattleEvents.UnitCure]: [UnitCureEvent, EventPriority];

  [BattleEvents.UnitEntersField]: [UnitEntersFieldEvent, EventPriority];
  [BattleEvents.UnitLeavesField]: [UnitEvent, EventPriority];
  [BattleEvents.UnitSwitch]: [UnitSwitchEvent, EventPriority];
  [BattleEvents.UnitUpdateSwitch]: [UnitUpdateSwitchEvent, EventPriority];
  [BattleEvents.UnitFinishSwitch]: [UnitSwitchEvent, EventPriority];
  [BattleEvents.UnitInterrupt]: [UnitEvent, EventPriority];

  [BattleEvents.UnitAddAbility]: [UnitAbilityEvent, EventPriority];
  [BattleEvents.UnitRemoveAbility]: [UnitAbilityEvent, EventPriority];
  [BattleEvents.UnitEnableAbility]: [UnitAbilityEvent, EventPriority];
  [BattleEvents.UnitDisableAbility]: [UnitAbilityEvent, EventPriority];
  [BattleEvents.UnitTriggerAbility]: [UnitAbilityEvent, EventPriority];

  [BattleEvents.UnitAddItem]: [UnitItemEvent, EventPriority];
  [BattleEvents.UnitRemoveItem]: [UnitRemoveItemEvent, EventPriority];

  [BattleEvents.UnitEnableItem]: [UnitItemEvent, EventPriority];
  [BattleEvents.UnitDisableItem]: [UnitItemEvent, EventPriority];
  [BattleEvents.UnitTriggerItem]: [UnitItemEvent, EventPriority];

  [BattleEvents.UnitAddMove]: [UnitMoveEvent, EventPriority];
  [BattleEvents.UnitSetMovePoints]: [UnitMovePointsEvent, EventPriority];
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

  [BattleEvents.UnitTriggerMoveTarget]: [UnitTriggerMoveEvent, AttackPriority];
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
  [BattleEvents.UnitSetNature]: [UnitSetNatureEvent, EventPriority];
  // Meters and kilograms: weight-driven moves read them, and a move
  // that shrinks or lightens a unit goes through the same setters
  [BattleEvents.UnitSetHeight]: [UnitSetValueEvent, EventPriority];
  [BattleEvents.UnitSetWeight]: [UnitSetValueEvent, EventPriority];
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
  [BattleEvents.CheckUnitAIMoveScore]: [CheckUnitAIMoveScoreEvent, AttackPriority];
  [BattleEvents.CheckUnitAIMoveUsable]: [CheckUnitAIMoveUsableEvent, AttackPriority];
  [BattleEvents.UnitAIChooseMove]: [UnitAIChooseMoveEvent, EventPriority];
  [BattleEvents.CheckUnitAIRating]: [CheckUnitAIRatingEvent, EventPriority];
  [BattleEvents.CheckTeamAIUnit]: [CheckTeamAIUnitEvent, EventPriority];
  [BattleEvents.CheckUnitCanConsumeItem]: [CheckUnitCanConsumeItemEvent, EventPriority];
  [BattleEvents.CheckUnitItemThreshold]: [CheckUnitItemThresholdEvent, EventPriority];
  [BattleEvents.CheckUnitDrain]: [CheckUnitDrainEvent, EventPriority];
  [BattleEvents.CheckUnitStatusDuration]: [CheckUnitStatusDurationEvent, EventPriority];
  [BattleEvents.CheckTeamStatusDuration]: [CheckTeamStatusDurationEvent, EventPriority];
  [BattleEvents.CheckUnitWeatherDuration]: [CheckUnitWeatherDurationEvent, EventPriority];
  [BattleEvents.UnitUpdateStatusTimer]: [UnitUpdateStatusTimerEvent, EventPriority];
  [BattleEvents.CheckUnitCanAddStage]: [CheckUnitCanUpdateStageEvent, EventPriority];
  [BattleEvents.CheckUnitCanRemoveStage]: [CheckUnitCanUpdateStageEvent, EventPriority];
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
  /**
   * What has been spent on the move — PP Ups, up to `PP_UP_LIMIT`.
   * Zero for anything the unit was not fielded with points for: a
   * wild pokemon, a grunt's party, a raid boss
   */
  points: number;
}

export interface ChannelingData extends CastingData {
  steps: number;
}
