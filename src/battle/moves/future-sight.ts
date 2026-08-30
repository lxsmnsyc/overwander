import { EventPriority } from '../../core/event-emitter';
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

interface Pending {
  source: Unit;
  target: Unit;
  remaining: number;
}

/**
 * Future Sight is cast now and lands later: the hit is queued, and
 * whatever the target is doing when the time comes is what it is
 * doing when it arrives
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
      const data = getMoveData(Moves.FutureSight);

      strike.source.attack(
        strike.target,
        Moves.FutureSight,
        strike.source.checkMovePower(Moves.FutureSight, target) ?? 0,
        strike.source.checkMoveType(Moves.FutureSight, target),
        data.category,
        MoveAttackFlags.Critical,
      );
    }

    if (pending.length === 0) {
      timer.stop();
    }
  });

  timer.stop();

  // The cast queues the strike instead of landing one, so the shared
  // hit resolver is kept out of it
  battle.on(BattleEvents.UnitTriggerMoveEffect, EventPriority.Pre, (event) => {
    if (event.move !== Moves.FutureSight || event.target.type !== MoveTargetType.Unit) {
      return;
    }

    event.disabled = true;
    pending.push({ source: event.source, target: event.target.unit, remaining: DELAY });
    timer.start();
  });
}
