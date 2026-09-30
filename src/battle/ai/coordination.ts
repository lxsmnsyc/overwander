import { AttackPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import type Battle from '../core';
import {
  BattleEvents,
  type CheckUnitAIMoveUsableEvent,
  type MoveTarget,
  MoveTargetType,
} from '../events';
import type Unit from '../unit';
import { getAIContext } from './context';
import { MoveRole, getMoveRoles } from './roles';

/** Hazards laid in layers, so a second cast still adds one */
const LAYERED = new Set<Moves>([Moves.Spikes, Moves.ToxicSpikes]);

function sameTarget(a: MoveTarget, b: MoveTarget): boolean {
  switch (a.type) {
    case MoveTargetType.Unit:
      return b.type === MoveTargetType.Unit && a.unit === b.unit;
    case MoveTargetType.Team:
      return b.type === MoveTargetType.Team && a.team === b.team;
    default:
      return b.type === MoveTargetType.None;
  }
}

function hasRole(move: Moves, role: MoveRole): boolean {
  return getMoveRoles(move).has(role);
}

/**
 * Whether a teammate's cast already covers what this move would do, so
 * casting it too would only land on what is already there
 */
function covered(event: CheckUnitAIMoveUsableEvent, friend: Unit): boolean {
  const cast = friend.casting;

  if (cast == null) {
    return false;
  }

  const move = event.move;

  // The same veil or tailwind over the same team, the same sky,
  // terrain or room over the field, or the same hazard on the same side
  if (cast.move === move && sameTarget(cast.target, event.target)) {
    if (
      hasRole(move, MoveRole.TeamSetup) ||
      (hasRole(move, MoveRole.Shield) && cast.target.type === MoveTargetType.Team)
    ) {
      return friend.team === event.source.team;
    }
    return hasRole(move, MoveRole.Field) || (hasRole(move, MoveRole.Hazard) && !LAYERED.has(move));
  }

  // A foe takes one affliction at a time: a second one wound up at the
  // same target would find it taken
  return (
    hasRole(move, MoveRole.Status) &&
    hasRole(cast.move, MoveRole.Status) &&
    event.target.type === MoveTargetType.Unit &&
    sameTarget(cast.target, event.target)
  );
}

/**
 * Teammates decide one at a time but cast over each other, so a unit is
 * told what a friend is already winding up before it doubles it
 */
export default function setupCoordination(battle: Battle): void {
  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (!event.usable) {
      return;
    }
    for (const friend of getAIContext(battle, event.source).friends()) {
      if (friend !== event.source && covered(event, friend)) {
        event.usable = false;
        return;
      }
    }
  });
}
