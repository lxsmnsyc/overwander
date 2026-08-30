import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents } from '../events';
import type Unit from '../unit';

/**
 * The two moves that only work while the user is asleep. Sleep is not
 * usually a state a unit acts from, so both are cast through the
 * sleeping status' own opening rather than in spite of it
 */
const ASLEEP_ONLY = new Set<Moves>([Moves.Snore, Moves.SleepTalk]);

/**
 * What Sleep Talk will not call on: itself, the two fallbacks, and
 * the other move that only works asleep
 */
const NOT_CALLED = new Set<Moves>([
  Moves.SleepTalk,
  Moves.Snore,
  Moves.Struggle,
  Moves.Attack,
  Moves.Metronome,
  Moves.MirrorMove,
]);

function isAsleep(unit: Unit): boolean {
  return unit.status[Statuses.Sleeping] != null;
}

export default function setupSleepingMoves(battle: Battle): void {
  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (event.usable && ASLEEP_ONLY.has(event.move)) {
      event.usable = isAsleep(event.source);
    }
  });

  // Awake, neither of them happens at all: the move is refused where
  // it is asked for rather than fired and then undone
  battle.on(BattleEvents.CheckUnitTriggerMove, EventPriority.Exact, (event) => {
    if (event.success && ASLEEP_ONLY.has(event.move) && !isAsleep(event.source)) {
      event.success = false;
    }
  });

  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    if (event.move !== Moves.SleepTalk) {
      return;
    }

    const pool = Object.keys(event.source.moves)
      // The move table is keyed by the move enum, which comes back as
      // a string from Object.keys
      // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
      .map((move) => Number(move) as Moves)
      .filter((move) => !NOT_CALLED.has(move));

    if (pool.length === 0) {
      event.source.triggerMoveEffectFailed(event.move, event.target, event.steps);
      return;
    }

    const called = pool[Math.floor(battle.random() * pool.length)];
    const steps = event.source.checkMoveSteps(called, event.target);

    event.source.triggerMove(called, event.target, steps);

    if (steps > 0) {
      event.source.channel(called, event.target, steps - 1);
    }
  });
}
