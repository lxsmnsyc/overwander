import { EventPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import type Battle from '../core';
import { BattleEvents, MoveTargetType } from '../events';
import type Unit from '../unit';

interface DisableData {
  move: Moves;
  progress: number;
}

// Real-time equivalent of the 4-turn lock. A timer (not a count of
// other moves used) so units with a single move cannot be perma-locked
const DURATION = 5000;

// https://bulbapedia.bulbagarden.net/wiki/Disable_(move)
export default function setupDisable(battle: Battle): void {
  const instances = new Map<Unit, DisableData>();
  const lastUsed = new Map<Unit, Moves>();

  const timer = battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
    for (const [unit, data] of instances.entries()) {
      data.progress -= event.duration;

      if (data.progress <= 0) {
        release(unit);
      }
    }
  });

  timer.stop();

  function release(unit: Unit): void {
    const data = instances.get(unit);

    if (data) {
      instances.delete(unit);
      unit.enableMove(data.move);

      if (instances.size === 0) {
        timer.stop();
      }
    }
  }

  // Track the last move each unit finished using.
  // Pre: the Exact handler clears `casting` before triggering the move
  battle.on(BattleEvents.UnitFinishCast, EventPriority.Pre, (event) => {
    const casting = event.source.casting;

    if (casting) {
      lastUsed.set(event.source, casting.move);
    }
  });

  battle.on(BattleEvents.UnitTriggerMoveEffect, EventPriority.Exact, (event) => {
    if (event.move !== Moves.Disable || event.target.type !== MoveTargetType.Unit) {
      return;
    }

    const target = event.target.unit;

    // The move being used right now, otherwise the last one used
    const move = target.casting?.move ?? target.channeling?.move ?? lastUsed.get(target);

    // Fails when neither suffices, when the target no longer knows
    // the move, or when a move is already disabled
    if (move == null || target.moves[move] == null || instances.has(target)) {
      event.source.triggerMoveEffectFailed(event.move, event.target, event.steps);
      return;
    }

    // Disabling the move mid-use interrupts it
    if (target.casting?.move === move || target.channeling?.move === move) {
      target.interrupt();
    }

    target.disableMove(move);
    instances.set(target, { move, progress: DURATION });

    if (instances.size === 1) {
      timer.start();
    }
  });

  battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
    release(event.source);
    lastUsed.delete(event.source);
  });

  battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
    release(event.source);
    lastUsed.delete(event.source);
  });
}
