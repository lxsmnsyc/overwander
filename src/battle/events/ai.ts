import type { MoveTargetPriorities, Moves } from '../../data/ids/moves';
import type Unit from '../unit';
import type { UnitMoveEvent } from './move';
import type { MoveTarget } from './shapes';
import type { TeamEvent } from './team';
import type { UnitEvent } from './unit';

/** What the AI asks before it chooses: what a move is worth, and who is worth aiming at */
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
  /**
   * Whether something the unit could have cast was only held back by
   * its cooldown. It separates a unit waiting a moment from one with
   * nothing that works at all, which are the same empty `choice`
   */
  waiting: boolean;
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
