import type { BaseEvent } from '../../core/event-emitter';
import type { Stats } from '../../data/constants/stats';
import type { Types } from '../../data/constants/types';
import type { MoveCategories, MoveTargets, Moves } from '../../data/ids/moves';
import type Unit from '../unit';
import type {
  CastingData,
  ChannelingData,
  MoveTarget,
  ProgressData,
  TriggerMoveData,
} from './shapes';
import type { UnitDamageEvent, UnitEvent } from './unit';

/** Casting, channelling, and everything a blow is asked on the way in */
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
 * Resolves how a move is cast and who it reaches, which is the pair
 * `MoveTargets` and `MoveAffects`. Listeners may widen either:
 * Boss turns a move cast at one enemy into one cast at nobody, so it
 * fans out over the whole far side
 */
export interface CheckUnitMoveTargetingEvent extends UnitMoveEvent {
  target: MoveTargets;
  affects: number;
}

export interface CheckUnitMoveContactEvent extends CheckUnitMoveEvent {
  contact: boolean;
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

/**
 * The question both trigger gates ask. `success` opens true and a
 * listener answering false stops the move where it stands
 */
export interface CheckUnitTriggerMoveEvent extends UnitTriggerMoveEvent {
  success: boolean;
}

export interface UnitTriggerMoveUpdateEvent extends BaseEvent {
  data: Partial<TriggerMoveData>;
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

export interface CheckUnitRecoilEvent extends BaseEvent {
  parent: UnitDamageEvent;
  recoil: boolean;
}
