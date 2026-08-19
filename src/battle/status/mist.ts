import { EventPriority } from '../../core/event-emitter';
import { TeamStatuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, type EffectCause } from '../events';
import turns from '../turn';
import type Team from '../team';

interface MistData {
  progress: number;
  cause: EffectCause;
}

const MIST_DURATION = turns(5);

/**
 * Mist: while the veil holds, other units cannot lower the stages of
 * the protected team's members.
 */
export default function setupMistStatus(battle: Battle): void {
  const instances = new Map<Team, MistData>();

  const timer = battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
    for (const [team, data] of instances.entries()) {
      data.progress -= event.duration;

      if (data.progress <= 0) {
        team.removeStatus(TeamStatuses.Mist, data.cause);
      }
    }
  });

  timer.stop();

  battle.on(BattleEvents.TeamAddStatus, EventPriority.Post, (event) => {
    if (event.status === TeamStatuses.Mist && !instances.has(event.team)) {
      instances.set(event.team, {
        progress: MIST_DURATION,
        cause: event.cause,
      });

      if (instances.size === 1) {
        timer.start();
      }
    }
  });

  battle.on(BattleEvents.TeamRemoveStatus, EventPriority.Post, (event) => {
    if (event.status === TeamStatuses.Mist) {
      instances.delete(event.team);

      if (instances.size === 0) {
        timer.stop();
      }
    }
  });

  battle.on(BattleEvents.CheckUnitCanAddStage, EventPriority.Post, (event) => {
    if (
      event.success &&
      event.value < 0 &&
      event.source.team.status[TeamStatuses.Mist] != null &&
      'unit' in event.cause &&
      event.cause.unit !== event.source
    ) {
      event.success = false;
    }
  });

  battle.on(BattleEvents.CheckUnitCanRemoveStage, EventPriority.Post, (event) => {
    if (
      event.success &&
      event.value > 0 &&
      event.source.team.status[TeamStatuses.Mist] != null &&
      'unit' in event.cause &&
      event.cause.unit !== event.source
    ) {
      event.success = false;
    }
  });
}
