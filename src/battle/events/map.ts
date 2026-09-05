import type { AttackPriority, BaseEvent, EventPriority } from '../../core/event-emitter';
import type { EventMap } from '../../core/event-engine';
import type {
  CheckTeamAIUnitEvent,
  CheckUnitAIMoveScoreEvent,
  CheckUnitAIMoveUsableEvent,
  CheckUnitAIRatingEvent,
  UnitAIChooseMoveEvent,
} from './ai';
import type {
  CheckUnitAttackEffectChanceEvent,
  CheckUnitAttackEffectEvent,
  CheckUnitCanCastEvent,
  CheckUnitCanChannelEvent,
  CheckUnitMoveAccuracyEvent,
  CheckUnitMoveContactEvent,
  CheckUnitMoveHitsEvent,
  CheckUnitMoveImmunityEvent,
  CheckUnitMovePPEvent,
  CheckUnitMovePowerEvent,
  CheckUnitMovePriorityEvent,
  CheckUnitMoveStepsEvent,
  CheckUnitMoveTargetingEvent,
  CheckUnitMoveTimeEvent,
  CheckUnitMoveTypeEvent,
  CheckUnitRecoilEvent,
  CheckUnitTriggerMoveEvent,
  UnitAttackChildEvent,
  UnitAttackEvent,
  UnitAttackResolveAmountEvent,
  UnitAttackResolveCriticalEvent,
  UnitAttackResolveEffectivenessEvent,
  UnitAttackResolveStatEvent,
  UnitCastEvent,
  UnitChannelEvent,
  UnitMoveEvent,
  UnitMovePointsEvent,
  UnitTriggerMoveChildEvent,
  UnitTriggerMoveEvent,
  UnitTriggerMoveResolveAccuracyEvent,
  UnitTriggerMoveRollHitEvent,
  UnitTriggerMoveUpdateEvent,
  UnitUpdateCastEvent,
  UnitUpdateChannelEvent,
  UnitUpdateCooldownEvent,
} from './move';
import type BattleEvents from './names';
import type {
  AllianceEvent,
  AllianceTeamEvent,
  CheckTeamStatusDurationEvent,
  CheckTeamStatusImmunityEvent,
  TeamUnitEvent,
  TeamUpdateStatusEvent,
  TeamWeatherEvent,
} from './team';
import type {
  CheckUnitAbilityEvent,
  CheckUnitCanConsumeItemEvent,
  CheckUnitCanDamageEvent,
  CheckUnitCanHealEvent,
  CheckUnitCanUpdateStageEvent,
  CheckUnitDrainEvent,
  CheckUnitEscapeEvent,
  CheckUnitGroundedEvent,
  CheckUnitItemEvent,
  CheckUnitItemThresholdEvent,
  CheckUnitStageEvent,
  CheckUnitStatEvent,
  CheckUnitStatusDurationEvent,
  CheckUnitStatusImmunityEvent,
  CheckUnitWeightEvent,
  UnitAbilityEvent,
  UnitCureEvent,
  UnitDamageEvent,
  UnitEntersFieldEvent,
  UnitEvent,
  UnitFaintsEvent,
  UnitHealEvent,
  UnitItemEvent,
  UnitRemoveItemEvent,
  UnitResetStagesEvent,
  UnitSetGenderEvent,
  UnitSetNatureEvent,
  UnitSetStatEvent,
  UnitSetValueEvent,
  UnitSpeciesEvent,
  UnitStageEvent,
  UnitSwitchEvent,
  UnitTypeEvent,
  UnitUpdateStageEvent,
  UnitUpdateStatusEvent,
  UnitUpdateStatusTimerEvent,
  UnitUpdateSwitchEvent,
} from './unit';
import type {
  CheckUnitWeatherDurationEvent,
  TickEvent,
  UnitSetWeatherEvent,
  UnitWeatherEvent,
  WeatherEvent,
} from './weather';

/** Which event carries which shape, which is what the bus is typed by */
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
  [BattleEvents.CheckUnitMoveTargeting]: [CheckUnitMoveTargetingEvent, EventPriority];
  [BattleEvents.UnitSetWeather]: [UnitSetWeatherEvent, EventPriority];
  [BattleEvents.CheckUnitAbility]: [CheckUnitAbilityEvent, EventPriority];
  [BattleEvents.CheckUnitItem]: [CheckUnitItemEvent, EventPriority];
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

  [BattleEvents.UnitTriggerMove]: [UnitTriggerMoveEvent, AttackPriority];
  [BattleEvents.UnitTriggerMoveUpdate]: [UnitTriggerMoveUpdateEvent, EventPriority];
  [BattleEvents.UnitTriggerMoveEnd]: [UnitTriggerMoveEvent, EventPriority];

  [BattleEvents.UnitTriggerMoveTarget]: [UnitTriggerMoveEvent, AttackPriority];
  [BattleEvents.UnitTriggerMoveEffect]: [UnitTriggerMoveEvent, AttackPriority];
  [BattleEvents.CheckUnitTriggerMove]: [CheckUnitTriggerMoveEvent, EventPriority];
  [BattleEvents.CheckUnitTriggerMoveEffect]: [CheckUnitTriggerMoveEvent, EventPriority];
  [BattleEvents.CheckUnitTriggerMoveTarget]: [CheckUnitTriggerMoveEvent, AttackPriority];
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
