import { EventPriority } from '../../core/event-emitter';
import { Statuses, TeamStatuses } from '../../data/ids/status';
import type { Battle } from '../core';
import { BattleEvents } from '../events';
import { setupConfusedStatus } from './confused';
import { setupParalyzedStatus } from './paralyzed';
import { setupPoisonedStatus } from './poisoned';
import { setupRechargingStatus } from './recharging';
import { setupSeedingStatus } from './seeding';
import { setupSleepingStatus } from './sleeping';

const NON_REFRESHABLE_STATUS = new Set<Statuses>([
  Statuses.Paralyzed,
  Statuses.BadlyPoisoned,
  Statuses.Poisoned,
  Statuses.Seeding,
  Statuses.Sleeping,
]);

const NON_REFRESHABLE_TEAM_STATUS = new Set<TeamStatuses>([
  TeamStatuses.Reflect,
]);

function setupNonRefreshableStatus(battle: Battle) {
  battle.on(
    BattleEvents.CheckUnitStatusImmunity,
    EventPriority.Exact,
    event => {
      if (
        !event.immune &&
        NON_REFRESHABLE_STATUS.has(event.status) &&
        event.source.status[event.status]
      ) {
        event.immune = true;
      }
    },
  );

  battle.on(
    BattleEvents.CheckTeamStatusImmunity,
    EventPriority.Exact,
    event => {
      if (
        !event.immune &&
        NON_REFRESHABLE_TEAM_STATUS.has(event.status) &&
        event.team.status[event.status]
      ) {
        event.immune = true;
      }
    },
  );
}

export function seupStatus(battle: Battle) {
  setupPoisonedStatus(battle);
  setupSeedingStatus(battle);
  setupSleepingStatus(battle);
  setupParalyzedStatus(battle);
  setupConfusedStatus(battle);
  setupRechargingStatus(battle);

  setupNonRefreshableStatus(battle);
}
