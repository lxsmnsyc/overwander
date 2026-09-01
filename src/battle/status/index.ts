import { EventPriority } from '../../core/event-emitter';
import { Types } from '../../data/constants/types';
import { Statuses, TeamStatuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents } from '../events';
import setupBondedStatus from './bonded';
import setupBurnedStatus from './burned';
import setupCorneredStatus from './cornered';
import setupConfusedStatus from './confused';
import setupCursedStatus from './cursed';
import setupDormantStatus from './dormant';
import setupEncoredStatus from './encored';
import setupEnduringStatus from './enduring';
import setupFlinchedStatus from './flinched';
import setupFocusEnergyStatus from './focus-energy';
import setupFrozenStatus from './frozen';
import setupGroundedStatus from './grounded';
import setupIdentifiedStatus from './identified';
import setupInfatuatedStatus from './infatuated';
import setupMistStatus from './mist';
import setupNightmaredStatus from './nightmared';
import setupParalyzedStatus from './paralyzed';
import setupPerishingStatus from './perishing';
import setupProtectedStatus from './protected';
import { setupBadlyPoisonedStatus, setupPoisonedStatus } from './poisoned';
import setupRechargingStatus from './recharging';
import setupScreenStatus from './reflect';
import setupSafeguardStatus from './safeguard';
import setupSeedingStatus from './seeding';
import setupSleepingStatus from './sleeping';
import setupSubstitutedStatus from './substituted';
import setupSwitchingStatus from './switching';
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
 * What counts as asleep to anything that **preys** on a sleeper:
 * Dream Eater, Nightmare, Bad Dreams, and the two moves only a
 * sleeper can cast.
 *
 * Comatose is in it and ordinary sleep's other readers are not. A
 * comatose unit still acts, so it is deliberately out of
 * `MOVE_LOCKING_STATUS`, and it is not a status condition, so it is
 * out of `MAJOR_STATUS_CONDITIONS` and never feeds Guts or Facade
 */
export const ASLEEP_STATUSES = new Set<Statuses>([Statuses.Sleeping, Statuses.Comatose]);

/**
 * Statuses that block the unit from casting moves (each hooks
 * CheckUnitCanCast in its own setup)
 */
export const MOVE_LOCKING_STATUS = new Set<Statuses>([
  Statuses.Sleeping,
  Statuses.Frozen,
  Statuses.Flinched,
  Statuses.Recharging,
  Statuses.Dormant,
  Statuses.Switching,
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
  TeamStatuses.Mist,
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
  setupGroundedStatus(battle);
  setupDormantStatus(battle);
  setupSwitchingStatus(battle);
  setupMistStatus(battle);
  setupProtectedStatus(battle);
  setupEnduringStatus(battle);
  setupCorneredStatus(battle);
  setupNightmaredStatus(battle);
  setupPerishingStatus(battle);
  setupBondedStatus(battle);
  setupCursedStatus(battle);
  setupEncoredStatus(battle);
  setupIdentifiedStatus(battle);
  setupSafeguardStatus(battle);

  setupNonRefreshableStatus(battle);
  setupStatusTypeImmunity(battle);
}
