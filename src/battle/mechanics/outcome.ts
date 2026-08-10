import { EventPriority } from '../../core/event-emitter';
import type Alliance from '../alliance';
import type Battle from '../core';
import { BattleModes } from '../core';
import { BattleEvents } from '../events';
import { MOVE_LOCKING_STATUS } from '../status';
import type Unit from '../unit';
import { hasAnyStatus } from '../utils';

/**
 * Whether the unit still has something it could do: a move that is
 * neither disabled nor cooling down, and nothing stopping it from
 * using one. The check never asks the AI what it would pick — that
 * would consume battle randoms and pull the replay off its seed
 */
function canAct(unit: Unit): boolean {
  if (!unit.alive || unit.casting || unit.channeling || hasAnyStatus(unit, MOVE_LOCKING_STATUS)) {
    return false;
  }

  for (const state of Object.values(unit.moves)) {
    // tsc types the mapped-record values as possibly undefined;
    // tsgolint disagrees, so the guard is flagged as unnecessary
    // oxlint-disable-next-line typescript/no-unnecessary-condition
    if (state && !state.disabled && !state.cooldown) {
      return true;
    }
  }
  return false;
}

/**
 * Who the settled battle belongs to. One side left standing wins
 * outright. A raid that ends with nobody standing goes to the party:
 * a boss taken down with the last of the party is a raid beaten, and
 * only one side of a raid is the boss. Anywhere else, a field with
 * nobody standing — or one where several sides remain but none can
 * act — is a draw
 */
function resolveWinner(battle: Battle, standing: Set<Alliance>): Alliance | null {
  if (standing.size === 1) {
    return [...standing][0];
  }
  if (standing.size > 0 || battle.mode !== BattleModes.Raid) {
    return null;
  }

  const parties = [...battle.alliances].filter((alliance) => !alliance.boss);

  return parties.length === 1 ? parties[0] : null;
}

/**
 * The battle's terminal state. Rather than watching for knockouts,
 * the scan asks whether the fight can still go anywhere: is anything
 * mid-cast or mid-channel, and could any unit still act against a
 * living enemy? Once neither holds, the battle is over — victory
 * goes to the one alliance with units left standing.
 *
 * Reading it this way settles the fights a knockout watcher would
 * miss: a side that is alive but permanently unable to act ends the
 * battle just as a wiped one does. Who wins the settled field is
 * resolveWinner's call.
 */
export default function setupOutcomeMechanics(battle: Battle): void {
  battle.on(BattleEvents.Tick, EventPriority.Post, () => {
    if (battle.settled) {
      return;
    }

    const standing = new Set<Alliance>();
    let pending = false;

    for (const alliance of battle.alliances) {
      for (const team of alliance.teams) {
        for (const unit of team.units) {
          if (!unit.alive) {
            continue;
          }
          standing.add(alliance);

          // A cast or channel already under way is an action still
          // owed to the battle, however it resolves
          if (unit.casting != null || unit.channeling != null) {
            pending = true;
          }
        }
      }
    }

    if (pending) {
      return;
    }

    // With more than one side standing the fight can still go on, so
    // long as somebody has a move to make against someone else
    if (standing.size > 1) {
      for (const alliance of standing) {
        for (const team of alliance.teams) {
          for (const unit of team.units) {
            if (canAct(unit)) {
              return;
            }
          }
        }
      }
    }

    battle.settled = true;
    battle.winner = resolveWinner(battle, standing);
    battle.end();
  });
}
