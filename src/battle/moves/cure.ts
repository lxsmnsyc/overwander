import { AttackPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import { USELESS_PENALTY } from '../ai/score';
import type Battle from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';
import { ASLEEP_STATUSES, MAJOR_STATUS_CONDITIONS } from '../status';
import { Stats } from '../../data/constants/stats';
import { hasAnyStatus } from '../utils';

/**
 * The moves that take an ailment back off rather than putting one on.
 *
 * Refresh shakes off what the user is carrying, and Smelling Salts
 * wakes a paralysed target out of it, which is what pays for the
 * doubled hit it lands at the same time. Sparkling Aria washes a burn
 * off whatever it hits, and Purify cleans the target's status up and
 * is paid for it in health.
 */

/** What Purify puts back on the user, as a share of its HP */
export const PURIFY_HEAL = 0.5;

/** What a Refresh reaches: everything but sleep and ice */
const REFRESHED = new Set<Statuses>([
  Statuses.Burned,
  Statuses.Poisoned,
  Statuses.BadlyPoisoned,
  Statuses.Paralyzed,
]);

export default function setupCureMoves(battle: Battle): void {
  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    if (event.move === Moves.Refresh) {
      const cause = { type: EffectType.Move, move: event.move, unit: event.source } as const;

      for (const status of REFRESHED) {
        event.source.removeStatus(status, cause);
      }
      return;
    }

    if (event.move === Moves.SparklingAria && event.target.type === MoveTargetType.Unit) {
      event.target.unit.removeStatus(Statuses.Burned, {
        type: EffectType.Move,
        move: event.move,
        unit: event.source,
      });
    }

    if (event.move === Moves.Purify && event.target.type === MoveTargetType.Unit) {
      const target = event.target.unit;

      if (!hasAnyStatus(target, MAJOR_STATUS_CONDITIONS)) {
        event.source.triggerMoveEffectFailed(event.move, event.target, event.steps);
        return;
      }

      const cause = { type: EffectType.Move, move: event.move, unit: event.source } as const;

      for (const status of MAJOR_STATUS_CONDITIONS) {
        target.removeStatus(status, cause);
      }
      event.source.heal(cause, event.source, event.source.checkStat(Stats.HP, 0) * PURIFY_HEAL, 0);
      return;
    }

    if (event.move === Moves.SmellingSalts && event.target.type === MoveTargetType.Unit) {
      event.target.unit.removeStatus(Statuses.Paralyzed, {
        type: EffectType.Move,
        move: event.move,
        unit: event.source,
      });
    }

    // The slap is what wakes it, which is what the doubled hit pays
    // for: a target left asleep would simply be hit twice as hard
    if (event.move === Moves.WakeUpSlap && event.target.type === MoveTargetType.Unit) {
      for (const status of ASLEEP_STATUSES) {
        event.target.unit.removeStatus(status, {
          type: EffectType.Move,
          move: event.move,
          unit: event.source,
        });
      }
    }
  });

  // A Refresh with nothing to shake off is a cast spent on nothing
  battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    if (event.move === Moves.Refresh && !hasAnyStatus(event.source, REFRESHED)) {
      event.score -= USELESS_PENALTY;
    }
  });

  // And a Purify with nothing to clean up fails outright
  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (event.usable && event.move === Moves.Purify) {
      event.usable =
        event.target.type === MoveTargetType.Unit &&
        hasAnyStatus(event.target.unit, MAJOR_STATUS_CONDITIONS);
    }
  });
}
