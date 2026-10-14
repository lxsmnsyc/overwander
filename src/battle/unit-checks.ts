import { Types } from '../data/constants/types';
import type { Statuses } from '../data/ids/status';
import { type MoveTarget, MoveTargetType } from './events';
import type Unit from './unit';

/**
 * A unit as a move target, for the checks that have the unit in hand
 * rather than the target that was aimed at
 */
export function unitTarget(unit: Unit): MoveTarget {
  return { type: MoveTargetType.Unit, unit };
}

/**
 * Whether the unit currently has any status from the group
 */
export function hasAnyStatus(unit: Unit, statuses: Iterable<Statuses>): boolean {
  for (const status of statuses) {
    if (unit.status[status] != null) {
      return true;
    }
  }
  return false;
}

/**
 * Whether a unit slips out of whatever an opponent traps it with. A
 * Ghost type does, as in every modern game: binds, Mean Look and every
 * trapping ability. What a unit does to itself (Ingrain, a channel)
 * still holds it, so only the traps ask this
 */
export function slipsTraps(unit: Unit): boolean {
  return unit.types.has(Types.Ghost);
}
