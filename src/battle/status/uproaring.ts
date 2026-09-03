import { EventPriority } from '../../core/event-emitter';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, EffectType } from '../events';

/**
 * Uproaring: while anybody is making one, nothing on the field sleeps
 * through it. Sleepers already down are woken, and a Rest cast into
 * the noise puts nobody under.
 *
 * There is no timer on it: the noise lasts exactly as long as the
 * move making it, which is the move's own business
 * https://bulbapedia.bulbagarden.net/wiki/Uproar_(move)
 */
export default function setupUproaringStatus(battle: Battle): void {
  function isAnybodyUproaring(battleState: Battle): boolean {
    for (const team of battleState.teams()) {
      for (const unit of team.units) {
        if (unit.alive && unit.status[Statuses.Uproaring] != null) {
          return true;
        }
      }
    }
    return false;
  }

  battle.on(BattleEvents.CheckUnitStatusImmunity, EventPriority.Exact, (event) => {
    if (!event.immune && event.status === Statuses.Sleeping && isAnybodyUproaring(battle)) {
      event.immune = true;
    }
  });

  // The noise starting is what wakes everybody: whoever is already
  // under gets up with it
  battle.on(BattleEvents.UnitAddStatus, EventPriority.Post, (event) => {
    if (event.status !== Statuses.Uproaring) {
      return;
    }

    for (const team of battle.teams()) {
      for (const unit of team.units) {
        const asleep = unit.status[Statuses.Sleeping];

        if (unit.alive && asleep != null) {
          unit.removeStatus(Statuses.Sleeping, asleep);
        }
      }
    }
  });

  battle.on(BattleEvents.CheckUnitCanCast, EventPriority.Post, (event) => {
    if (event.success && event.source.status[Statuses.Uproaring] != null) {
      event.source.triggerStatus(Statuses.Uproaring, { type: EffectType.None });
    }
  });

  // Nothing shouts on the way down or on the way out
  for (const gone of [BattleEvents.UnitFaints, BattleEvents.UnitLeavesField] as const) {
    battle.on(gone, EventPriority.Post, (event) => {
      const noise = event.source.status[Statuses.Uproaring];

      if (noise != null) {
        event.source.removeStatus(Statuses.Uproaring, noise);
      }
    });
  }
}
