import { AttackPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import { getRegisteredMoves } from '../../data/moves';
import type Battle from '../core';
import { BattleEvents } from '../events';

/**
 * Moves Metronome never calls. The three nobody knows are in here for
 * the same reason as the two it would call on itself: a Metronome
 * that rolled Struggle would charge a quarter of the user's health
 * for a move it was never entitled to, and one that rolled Attack
 * would spend a real move to throw the feeblest thing in the game.
 *
 * Sketch is here because it is spent when it is drawn: a roll that
 * called it would hand over a move for good without costing the slot
 * a real Sketch costs
 */
const EXCLUDED = new Set<Moves>([
  Moves._Confused,
  Moves.Struggle,
  Moves.Attack,
  Moves.Metronome,
  Moves.MirrorMove,
  Moves.Sketch,
]);

// https://bulbapedia.bulbagarden.net/wiki/Metronome_(move)
export default function setupMetronome(battle: Battle): void {
  /**
   * The callable move pool, resolved once per battle setup (the move
   * registry is filled during data registration, before any battle).
   */
  const pool = getRegisteredMoves().filter((move) => !EXCLUDED.has(move));

  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    if (event.move !== Moves.Metronome) {
      return;
    }

    const called = pool[Math.floor(battle.random() * pool.length)];

    // Use the called move through the finish-cast flow so multi-step
    // moves channel their later steps
    const steps = event.source.checkMoveSteps(called, event.target);

    event.source.triggerMove(called, event.target, steps);

    if (steps > 0) {
      event.source.channel(called, event.target, steps - 1);
    }
  });
}
