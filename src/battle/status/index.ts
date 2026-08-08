import { EventPriority } from '../../core/event-emitter';
import { Types } from '../../data/constants/types';
import { Statuses, TeamStatuses } from '../../data/ids/status';
import type { Battle } from '../core';
import { BattleEvents } from '../events';
import { setupBurnedStatus } from './burned';
import { setupConfusedStatus } from './confused';
import { setupFlinchedStatus } from './flinched';
import { setupFrozenStatus } from './frozen';
import { setupParalyzedStatus } from './paralyzed';
import { setupPoisonedStatus } from './poisoned';
import { setupRechargingStatus } from './recharging';
import { setupSeedingStatus } from './seeding';
import { setupSleepingStatus } from './sleeping';
import { setupSubstitutedStatus } from './substituted';
import { setupTrappedStatus } from './trapped';

const NON_REFRESHABLE_STATUS = new Set<Statuses>([
  Statuses.Paralyzed,
  Statuses.BadlyPoisoned,
  Statuses.Poisoned,
  Statuses.Seeding,
  Statuses.Sleeping,
  Statuses.Burned,
  Statuses.Trapped,
  Statuses.Frozen,
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

/**
 * Types immune to a status condition (modern mechanics)
 */
const STATUS_TYPE_IMMUNITY: { [key in Statuses]?: Types[] } = {
  [Statuses.Burned]: [Types.Fire],
  [Statuses.Frozen]: [Types.Ice],
  [Statuses.Paralyzed]: [Types.Electric],
  [Statuses.Poisoned]: [Types.Poison, Types.Steel],
  [Statuses.BadlyPoisoned]: [Types.Poison, Types.Steel],
};

function setupStatusTypeImmunity(battle: Battle) {
  battle.on(
    BattleEvents.CheckUnitStatusImmunity,
    EventPriority.Exact,
    event => {
      if (!event.immune) {
        const types = STATUS_TYPE_IMMUNITY[event.status];

        if (types?.some(type => event.source.types.has(type))) {
          event.immune = true;
        }
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
  setupSubstitutedStatus(battle);
  setupBurnedStatus(battle);
  setupTrappedStatus(battle);
  setupFlinchedStatus(battle);
  setupFrozenStatus(battle);

  setupNonRefreshableStatus(battle);
  setupStatusTypeImmunity(battle);
}
