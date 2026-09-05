import type { BaseEvent } from '../../core/event-emitter';
import type { Stages, Stats, StatsKind } from '../../data/constants/stats';
import type { Types } from '../../data/constants/types';
import type Abilities from '../../data/ids/abilities';
import type { Items } from '../../data/ids/items';
import type Natures from '../../data/ids/natures';
import type { Genders, Species } from '../../data/ids/species';
import type { Statuses } from '../../data/ids/status';
import type Unit from '../unit';
import type { EffectCause, ProgressData } from './shapes';

/** What happens to one unit: its stats, its stages, its statuses and what it holds */
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

/**
 * Resolves whether the unit stands on the ground; airborne traits
 * (Floating status, Flying type, Levitate) clear it and the Grounded
 * status forces it back
 */
export interface CheckUnitGroundedEvent extends UnitEvent {
  grounded: boolean;
}

export interface CheckUnitWeightEvent extends UnitEvent {
  weight: number;
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

export interface CheckUnitItemEvent extends UnitEvent {
  item: Items;
  enabled: boolean;
}

export interface UnitSetNatureEvent extends UnitEvent {
  nature: Natures;
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
  /**
   * The question is being asked speculatively, by the AI weighing a
   * move it has not cast. A listener may still answer it, but must do
   * nothing else: no cue, no stage of its own, nothing a watcher
   * could see
   */
  simulated: boolean;
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
  /**
   * What sent them walking. It is what tells a swap somebody chose
   * from one they were made to make, and a Teleport from either: a
   * unit that vanishes is out of reach while it goes, and one merely
   * walking is not
   */
  cause: EffectCause;
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
