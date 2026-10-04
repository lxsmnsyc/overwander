import type { TeamStatuses } from '../../data/ids/status';
import type Battle from '../core';
import type { EffectCause } from '../events';
import type Team from '../team';

/**
 * Everything laid on one side of the field that a Court Change carries
 * across: the screens, Mist, Safeguard and Tailwind with however long
 * each has left, and the hazards with however deep each lies.
 *
 * Each keeps its own state where it is implemented, so each registers
 * how to read it and how to write it, and the swap is the same two
 * calls for all of them. A value is the time left in milliseconds, or
 * the layers laid, and undefined is nothing there
 */
export interface SideCondition {
  read: (team: Team) => number | undefined;
  write: (team: Team, value: number | undefined, cause: EffectCause) => void;
}

const REGISTERED = new WeakMap<Battle, SideCondition[]>();

export function registerSideCondition(battle: Battle, condition: SideCondition): void {
  const known = REGISTERED.get(battle);

  if (known == null) {
    REGISTERED.set(battle, [condition]);
  } else {
    known.push(condition);
  }
}

export function sideConditions(battle: Battle): readonly SideCondition[] {
  return REGISTERED.get(battle) ?? [];
}

/** What a timed team status keeps for each side it covers */
interface TimedInstance {
  progress: number;
  cause: EffectCause;
}

/**
 * Registers a team status that runs on a clock of its own: written by
 * putting the status up and then setting what is left of it, so the
 * clock it lands with is the one it was carried across with
 */
export function registerTimedTeamStatus(
  battle: Battle,
  status: TeamStatuses,
  instances: Map<Team, TimedInstance>,
): void {
  registerSideCondition(battle, {
    read: (team) => instances.get(team)?.progress,
    write: (team, value, cause) => {
      const held = team.status[status];

      if (value == null) {
        if (held != null) {
          team.removeStatus(status, held);
        }
        return;
      }
      if (held == null) {
        team.addStatus(status, cause);
      }

      const instance = instances.get(team);

      if (instance != null) {
        instance.progress = value;
      }
    },
  });
}
