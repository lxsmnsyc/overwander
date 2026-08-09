import { EventPriority } from '../../core/event-emitter';
import { Types } from '../../data/constants/types';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents } from '../events';

/**
 * The mutually exclusive positional statuses: a unit is forced onto
 * the ground, hovering above it, or underwater — never several at
 * once. Applying one removes the others.
 */
const POSITION_STATUSES = new Set<Statuses>([
  Statuses.Grounded,
  Statuses.Floating,
  Statuses.Submerged,
]);

/**
 * Resolves the CheckUnitGrounded baseline from the positional
 * statuses: the Grounded status (e.g. Gravity, Smack Down) overrides
 * every airborne trait, while the Floating status (e.g. a held
 * Balloon, Fly's airborne step) and the Flying type lift the unit.
 * Airborne abilities (e.g. Levitate) adjust the result in their own
 * setups.
 */
export default function setupGroundedStatus(battle: Battle): void {
  battle.on(BattleEvents.CheckUnitGrounded, EventPriority.Exact, (event) => {
    const unit = event.source;

    if (unit.status[Statuses.Grounded] != null) {
      event.grounded = true;
    } else if (unit.status[Statuses.Floating] != null || unit.types.has(Types.Flying)) {
      event.grounded = false;
    }
  });

  // The latest applied position replaces the others
  battle.on(BattleEvents.UnitAddStatus, EventPriority.Post, (event) => {
    if (POSITION_STATUSES.has(event.status)) {
      for (const status of POSITION_STATUSES) {
        const cause = event.source.status[status];

        if (status !== event.status && cause) {
          event.source.removeStatus(status, cause);
        }
      }
    }
  });
}
