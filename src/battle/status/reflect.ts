import { EventPriority } from '../../core/event-emitter';
import { MoveAttackFlags, MoveCategories } from '../../data/ids/moves';
import { TeamStatuses } from '../../data/ids/status';
import type { Battle } from '../core';
import { BattleEvents, type EffectCause } from '../events';
import type { Team } from '../team';

interface ReflectData {
  progress: number;
  cause: EffectCause;
}

const REFLECT_DURATION = 10000; // 10 seconds
const DAMAGE_REDUCTION = 2732 / 4096;

export function setupReflectStatus(battle: Battle) {
  const instances = new Map<Team, ReflectData>();

  const timer = battle.on(BattleEvents.Tick, EventPriority.Post, event => {
    for (const [unit, data] of instances.entries()) {
      data.progress -= event.duration;

      if (data.progress <= 0) {
        unit.removeStatus(TeamStatuses.Reflect, data.cause);
      }
    }
  });

  timer.stop();

  battle.on(BattleEvents.TeamAddStatus, EventPriority.Post, event => {
    if (event.status === TeamStatuses.Reflect && !instances.has(event.team)) {
      instances.set(event.team, {
        progress: REFLECT_DURATION,
        cause: event.cause,
      });

      if (instances.size === 1) {
        timer.start();
      }
    }
  });

  battle.on(BattleEvents.TeamRemoveStatus, EventPriority.Post, event => {
    if (event.status === TeamStatuses.Reflect) {
      instances.delete(event.team);

      if (instances.size === 0) {
        timer.stop();
      }
    }
  });

  battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, event => {
    if (
      event.parent.category === MoveCategories.Physical &&
      event.parent.target.team.status[TeamStatuses.Reflect] &&
      !(event.parent.flags & MoveAttackFlags.Confused)
    ) {
      event.value *= DAMAGE_REDUCTION;
    }
  });
}
