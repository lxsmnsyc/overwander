import { AttackPriority } from '../../core/event-emitter';
import { Types } from '../../data/constants/types';
import { Moves } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import {
  BattleEvents,
  type CheckUnitAIMoveUsableEvent,
  type MoveTarget,
  MoveTargetType,
} from '../events';
import { CALLS } from '../moves/follow-me';
import { IDENTIFYING_MOVES } from '../moves/foresight';
import { LOCKOUTS } from '../moves/lockouts';
import { NO_ESCAPE_MOVES } from '../moves/no-escape';
import { STATUS_MOVES } from '../moves/status';
import { PARTY_CURES } from '../moves/support';
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

/** The statuses cast through their own machinery rather than the status table */
const MARKS = new Map<Moves, Statuses>([
  [Moves.LeechSeed, Statuses.Seeding],
  [Moves.Nightmare, Statuses.Nightmared],
  [Moves.Encore, Statuses.Encored],
  [Moves.Telekinesis, Statuses.Telekinetic],
  ...[...NO_ESCAPE_MOVES].map((move) => [move, Statuses.Cornered] as const),
  ...LOCKOUTS,
  ...IDENTIFYING_MOVES,
]);

/** Moves that leave one change on their target, so a second at it finds it made */
const ONCE_AT_A_TARGET = new Set<Moves>([
  Moves.Disable,
  Moves.Soak,
  Moves.TrickOrTreat,
  Moves.ForestsCurse,
  Moves.Electrify,
  Moves.Powder,
  Moves.Quash,
  Moves.GastroAcid,
  Moves.WorrySeed,
  Moves.SimpleBeam,
]);

/** Moves whose whole work is done across the field by the first */
const ONCE_ON_THE_FIELD = new Set<Moves>([Moves.PerishSong, Moves.Haze, Moves.FairyLock]);

function statusOf(move: Moves): Statuses | undefined {
  return STATUS_MOVES[move] ?? MARKS.get(move);
}

function isGhost(unit: Unit): boolean {
  return unit.types.has(Types.Ghost);
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
  // terrain or room over the field, the same hazard on the same side,
  // or the same change to the same foe
  if (cast.move === move && sameTarget(cast.target, event.target)) {
    if (
      hasRole(move, MoveRole.TeamSetup) ||
      (hasRole(move, MoveRole.Shield) && cast.target.type === MoveTargetType.Team)
    ) {
      return friend.team === event.source.team;
    }
    if (
      hasRole(move, MoveRole.Field) ||
      (hasRole(move, MoveRole.Hazard) && !LAYERED.has(move)) ||
      ONCE_AT_A_TARGET.has(move) ||
      ONCE_ON_THE_FIELD.has(move)
    ) {
      return true;
    }
    // Only a Ghost's Curse lands on the target; anything else's raises itself
    if (move === Moves.Curse && isGhost(event.source) && isGhost(friend)) {
      return true;
    }
  }

  // One cure clears the whole party, and only one unit draws the hits
  if (PARTY_CURES.has(move) && PARTY_CURES.has(cast.move)) {
    return friend.team === event.source.team;
  }
  if (CALLS.has(move) && CALLS.has(cast.move)) {
    return true;
  }

  // Statuses stack, so only the same one wound up at the same target
  // would find it taken
  const status = statusOf(move);

  return status != null && statusOf(cast.move) === status && sameTarget(cast.target, event.target);
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
