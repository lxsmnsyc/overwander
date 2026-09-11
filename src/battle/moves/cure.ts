import { AttackPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import { USELESS_PENALTY } from '../ai/score';
import type Battle from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';
import { hasAnyStatus } from '../utils';

/**
 * The moves that take an ailment back off rather than putting one on.
 *
 * Refresh shakes off what the user is carrying, and Smelling Salts
 * wakes a paralysed target out of it, which is what pays for the
 * doubled hit it lands at the same time.
 */

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

    if (event.move === Moves.SmellingSalts && event.target.type === MoveTargetType.Unit) {
      event.target.unit.removeStatus(Statuses.Paralyzed, {
        type: EffectType.Move,
        move: event.move,
        unit: event.source,
      });
    }
  });

  // A Refresh with nothing to shake off is a cast spent on nothing
  battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    if (event.move === Moves.Refresh && !hasAnyStatus(event.source, REFRESHED)) {
      event.score -= USELESS_PENALTY;
    }
  });
}
