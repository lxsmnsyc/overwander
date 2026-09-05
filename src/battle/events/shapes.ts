import type Abilities from '../../data/ids/abilities';
import type { Items } from '../../data/ids/items';
import type { Moves } from '../../data/ids/moves';
import type { Weathers } from '../../data/ids/status';
import type Team from '../team';
import type Unit from '../unit';
import type { UnitTriggerMoveEvent } from './move';

/**
 * The shapes an event carries that are not events: what a move is
 * aimed at, what caused an effect, and the clocks a cast or a
 * cooldown runs on
 */
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
