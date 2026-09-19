import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
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
  /**
   * Whether a queued strike is arriving right now. The cast refuses its
   * own effect, and this is what lets the landing through it: the
   * effect is what deals the blow and what the canvas draws the move
   * from, so a strike resolved around it arrives invisibly
   */
  let landing = false;

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

      landing = true;
      try {
        strike.source.triggerMoveEffect(strike.move, target, 0);
      } finally {
        landing = false;
      }
    }

    if (pending.length === 0) {
      timer.stop();
    }
  });

  timer.stop();

  // Nothing resolves on the cast: what a Future Sight does now is
  // promise, and the promise is kept by the timer above
  battle.on(BattleEvents.CheckUnitTriggerMoveEffect, EventPriority.Exact, (event) => {
    if (!landing && event.success && DELAYED_MOVES.has(event.move)) {
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
