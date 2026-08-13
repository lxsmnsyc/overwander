import { EventPriority } from '../../core/event-emitter';
import { MoveAttackFlags, MoveCategories } from '../../data/ids/moves';
import { TeamStatuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, type EffectCause } from '../events';
import type Team from '../team';

interface ScreenData {
  progress: number;
  cause: EffectCause;
}

/**
 * How long a screen holds without help. A Light Clay lengthens it
 * through CheckTeamStatusDuration
 */
export const SCREEN_DURATION = 10000;
const DAMAGE_REDUCTION = 2732 / 4096;

/**
 * Screen team statuses: reduce incoming damage of one category for
 * the whole team until the screen expires (Reflect for physical,
 * Light Screen for special).
 */
function createScreenStatus(status: TeamStatuses, category: MoveCategories) {
  return (battle: Battle) => {
    const instances = new Map<Team, ScreenData>();

    const timer = battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
      for (const [team, data] of instances.entries()) {
        data.progress -= event.duration;

        if (data.progress <= 0) {
          team.removeStatus(status, data.cause);
        }
      }
    });

    timer.stop();

    battle.on(BattleEvents.TeamAddStatus, EventPriority.Post, (event) => {
      if (event.status === status && !instances.has(event.team)) {
        instances.set(event.team, {
          // Resolved through the event engine, so that what the unit
          // who put the screen up is holding — a Light Clay — can
          // lengthen it
          progress: event.team.checkStatusDuration(status, SCREEN_DURATION, event.cause),
          cause: event.cause,
        });

        if (instances.size === 1) {
          timer.start();
        }
      }
    });

    battle.on(BattleEvents.TeamRemoveStatus, EventPriority.Post, (event) => {
      if (event.status === status) {
        instances.delete(event.team);

        if (instances.size === 0) {
          timer.stop();
        }
      }
    });

    battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
      if (
        event.parent.category === category &&
        event.parent.target.team.status[status] != null &&
        !(event.parent.flags & MoveAttackFlags.Confused)
      ) {
        event.value *= DAMAGE_REDUCTION;
      }
    });
  };
}

const setupReflectStatus = createScreenStatus(TeamStatuses.Reflect, MoveCategories.Physical);

const setupLightScreenStatus = createScreenStatus(TeamStatuses.LightScreen, MoveCategories.Special);

export default function setupScreenStatus(battle: Battle): void {
  setupReflectStatus(battle);
  setupLightScreenStatus(battle);
}
