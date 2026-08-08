import { EventPriority } from '../../core/event-emitter';
import { Types } from '../../data/constants/types';
import { Statuses, TeamStatuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents } from '../events';
import setupBurnedStatus from './burned';
import setupConfusedStatus from './confused';
import setupFlinchedStatus from './flinched';
import setupFocusEnergyStatus from './focus-energy';
import setupFrozenStatus from './frozen';
import setupInfatuatedStatus from './infatuated';
import setupParalyzedStatus from './paralyzed';
import { setupBadlyPoisonedStatus, setupPoisonedStatus } from './poisoned';
import setupRechargingStatus from './recharging';
import setupScreenStatus from './reflect';
import setupSeedingStatus from './seeding';
import setupSleepingStatus from './sleeping';
import setupSubstitutedStatus from './substituted';
import setupTrappedStatus from './trapped';

/**
 * The major status conditions (used by Guts, Shed Skin, and similar
 * status-sensitive effects)
 */
export const MAJOR_STATUS_CONDITIONS = new Set<Statuses>([
  Statuses.Poisoned,
  Statuses.BadlyPoisoned,
  Statuses.Burned,
  Statuses.Paralyzed,
  Statuses.Sleeping,
  Statuses.Frozen,
]);

/**
 * Statuses that block the unit from casting moves (each hooks
 * CheckUnitCanCast in its own setup)
 */
export const MOVE_LOCKING_STATUS = new Set<Statuses>([
  Statuses.Sleeping,
  Statuses.Frozen,
  Statuses.Flinched,
  Statuses.Recharging,
]);

const NON_REFRESHABLE_STATUS = new Set<Statuses>([
  Statuses.Paralyzed,
  Statuses.BadlyPoisoned,
  Statuses.Poisoned,
  Statuses.Seeding,
  Statuses.Sleeping,
  Statuses.Burned,
  Statuses.Trapped,
  Statuses.Frozen,
  Statuses.FocusEnergy,
  Statuses.Infatuated,
]);

const NON_REFRESHABLE_TEAM_STATUS = new Set<TeamStatuses>([
  TeamStatuses.Reflect,
  TeamStatuses.LightScreen,
]);

function setupNonRefreshableStatus(battle: Battle): void {
  battle.on(BattleEvents.CheckUnitStatusImmunity, EventPriority.Exact, (event) => {
    if (
      !event.immune &&
      NON_REFRESHABLE_STATUS.has(event.status) &&
      event.source.status[event.status]
    ) {
      event.immune = true;
    }
  });

  battle.on(BattleEvents.CheckTeamStatusImmunity, EventPriority.Exact, (event) => {
    if (
      !event.immune &&
      NON_REFRESHABLE_TEAM_STATUS.has(event.status) &&
      event.team.status[event.status]
    ) {
      event.immune = true;
    }
  });
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

function setupStatusTypeImmunity(battle: Battle): void {
  battle.on(BattleEvents.CheckUnitStatusImmunity, EventPriority.Exact, (event) => {
    if (!event.immune) {
      const types = STATUS_TYPE_IMMUNITY[event.status];

      if (types?.some((type) => event.source.types.has(type))) {
        event.immune = true;
      }
    }
  });
}

export default function setupStatus(battle: Battle): void {
  setupPoisonedStatus(battle);
  setupBadlyPoisonedStatus(battle);
  setupSeedingStatus(battle);
  setupScreenStatus(battle);
  setupSleepingStatus(battle);
  setupParalyzedStatus(battle);
  setupConfusedStatus(battle);
  setupRechargingStatus(battle);
  setupSubstitutedStatus(battle);
  setupBurnedStatus(battle);
  setupTrappedStatus(battle);
  setupFlinchedStatus(battle);
  setupFrozenStatus(battle);
  setupFocusEnergyStatus(battle);
  setupInfatuatedStatus(battle);

  setupNonRefreshableStatus(battle);
  setupStatusTypeImmunity(battle);
}
