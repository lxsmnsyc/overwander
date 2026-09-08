import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { MoveAttackFlags, Moves } from '../../data/ids/moves';
import { getMoveData } from '../../data/moves';
import type Battle from '../core';
import { BattleEvents, MoveTargetType } from '../events';
import turns from '../turn';
import type Unit from '../unit';

/**
 * How long the strike hangs over the target before it lands
 */
const DELAY = turns(2);

/** The moves that are cast now and land later */
const DELAYED_MOVES = new Set<Moves>([Moves.FutureSight, Moves.DoomDesire]);

interface Pending {
  source: Unit;
  target: Unit;
  move: Moves;
  remaining: number;
}

/**
 * Future Sight and Doom Desire are cast now and land later: the hit is
 * queued, and whatever the target is doing when the time comes is what
 * it is doing when it arrives
 * https://bulbapedia.bulbagarden.net/wiki/Future_Sight_(move)
 */
export default function setupFutureSight(battle: Battle): void {
  const pending: Pending[] = [];

  const timer = battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
    for (const strike of [...pending]) {
      strike.remaining -= event.duration;

      if (strike.remaining > 0) {
        continue;
      }

      pending.splice(pending.indexOf(strike), 1);

      if (!strike.target.alive || !strike.source.alive) {
        continue;
      }

      const target = { type: MoveTargetType.Unit, unit: strike.target } as const;
      const data = getMoveData(strike.move);

      strike.source.attack(
        strike.target,
        strike.move,
        strike.source.checkMovePower(strike.move, target) ?? 0,
        strike.source.checkMoveType(strike.move, target),
        data.category,
        MoveAttackFlags.Critical,
      );
    }

    if (pending.length === 0) {
      timer.stop();
    }
  });

  timer.stop();

  // Nothing resolves on the cast: what a Future Sight does now is
  // promise, and the promise is kept by the timer above
  battle.on(BattleEvents.CheckUnitTriggerMoveEffect, EventPriority.Exact, (event) => {
    if (event.success && DELAYED_MOVES.has(event.move)) {
      event.success = false;
    }
  });

  // The strike is queued where the move reached its target, which is
  // the last thing that happens before the effect would have
  battle.on(BattleEvents.UnitTriggerMoveTarget, AttackPriority.Post, (event) => {
    if (!DELAYED_MOVES.has(event.move) || event.target.type !== MoveTargetType.Unit) {
      return;
    }

    pending.push({
      source: event.source,
      target: event.target.unit,
      move: event.move,
      remaining: DELAY,
    });
    timer.start();
  });
}
