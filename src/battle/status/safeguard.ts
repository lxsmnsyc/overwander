import { EventPriority } from '../../core/event-emitter';
import { Statuses, TeamStatuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, type EffectCause } from '../events';
import type Team from '../team';
import turns from '../turn';

interface SafeguardData {
  progress: number;
  cause: EffectCause;
}

const SAFEGUARD_DURATION = turns(5);

/**
 * What the veil keeps off its side. It is written out rather than
 * read off the major-status list, which lives in the file that wires
 * this one up. What a unit does to itself passes
 * through: a Rest is a unit choosing to sleep
 */
const WARDED = new Set<Statuses>([
  Statuses.Poisoned,
  Statuses.BadlyPoisoned,
  Statuses.Burned,
  Statuses.Paralyzed,
  Statuses.Sleeping,
  Statuses.Frozen,
  Statuses.Confused,
  Statuses.Infatuated,
]);

/**
 * Safeguard: nothing on the other side can put a status on this one
 * while it holds. https://bulbapedia.bulbagarden.net/wiki/Safeguard_(move)
 */
export default function setupSafeguardStatus(battle: Battle): void {
  const instances = new Map<Team, SafeguardData>();

  const timer = battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
    for (const [team, data] of instances.entries()) {
      data.progress -= event.duration;

      if (data.progress <= 0) {
        team.removeStatus(TeamStatuses.Safeguard, data.cause);
      }
    }
  });

  timer.stop();

  battle.on(BattleEvents.TeamAddStatus, EventPriority.Post, (event) => {
    if (event.status === TeamStatuses.Safeguard && !instances.has(event.team)) {
      instances.set(event.team, { progress: SAFEGUARD_DURATION, cause: event.cause });

      if (instances.size === 1) {
        timer.start();
      }
    }
  });

  battle.on(BattleEvents.TeamRemoveStatus, EventPriority.Post, (event) => {
    if (event.status === TeamStatuses.Safeguard) {
      instances.delete(event.team);

      if (instances.size === 0) {
        timer.stop();
      }
    }
  });

  battle.on(BattleEvents.CheckUnitStatusImmunity, EventPriority.Post, (event) => {
    if (
      !event.immune &&
      WARDED.has(event.status) &&
      event.source.team.status[TeamStatuses.Safeguard] != null &&
      'unit' in event.cause &&
      event.cause.unit !== event.source
    ) {
      event.immune = true;
    }
  });
}
