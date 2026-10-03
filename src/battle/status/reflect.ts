import { EventPriority } from '../../core/event-emitter';
import { MoveAttackFlags, MoveCategories } from '../../data/ids/moves';
import { TeamStatuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, type EffectCause } from '../events';
import turns from '../turn';
import type Team from '../team';

interface ScreenData {
  progress: number;
  cause: EffectCause;
}

/**
 * How long a screen holds without help. A Light Clay lengthens it
 * through CheckTeamStatusDuration
 */
export const SCREEN_DURATION = turns(5);
const DAMAGE_REDUCTION = 2732 / 4096;

/** The screen that already covers each category, which Aurora Veil does not stack on */
const OWN_SCREEN: { [key in MoveCategories]?: TeamStatuses } = {
  [MoveCategories.Physical]: TeamStatuses.Reflect,
  [MoveCategories.Special]: TeamStatuses.LightScreen,
};

/**
 * Screen team statuses: reduce incoming damage of their categories for
 * the whole team until the screen expires (Reflect for physical, Light
 * Screen for special, Aurora Veil for both).
 */
function createScreenStatus(status: TeamStatuses, categories: MoveCategories[]) {
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
      const team = event.parent.target.team;
      const own = OWN_SCREEN[event.parent.category];

      if (
        categories.includes(event.parent.category) &&
        team.status[status] != null &&
        // A veil over a screen of the same kind cuts the damage once
        (status !== TeamStatuses.AuroraVeil || own == null || team.status[own] == null) &&
        !(event.parent.flags & MoveAttackFlags.Confused)
      ) {
        event.value *= DAMAGE_REDUCTION;
      }
    });
  };
}

const setupReflectStatus = createScreenStatus(TeamStatuses.Reflect, [MoveCategories.Physical]);

const setupLightScreenStatus = createScreenStatus(TeamStatuses.LightScreen, [
  MoveCategories.Special,
]);

const setupAuroraVeilStatus = createScreenStatus(TeamStatuses.AuroraVeil, [
  MoveCategories.Physical,
  MoveCategories.Special,
]);

export default function setupScreenStatus(battle: Battle): void {
  setupReflectStatus(battle);
  setupLightScreenStatus(battle);
  setupAuroraVeilStatus(battle);
}
