import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import type Battle from '../core';
import { BattleEvents, MoveTargetType } from '../events';
import turns from '../turn';
import type Unit from '../unit';

interface DisableData {
  move: Moves;
  progress: number;
}

// A timer rather than a count of other moves used, so a unit with a
// single move cannot be locked out of the fight for good
const DURATION = turns(4);

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

  /**
   * What Disable would take away from the target: the move being used
   * right now, otherwise the last one used. Undefined when there is
   * nothing to take: the target has used nothing, no longer knows what
   * it used, or the move is already shut off. Never a move somebody
   * else locked, or whichever lock lifted first would hand it back
   */
  function getDisabledMove(target: Unit): Moves | undefined {
    if (instances.has(target)) {
      return undefined;
    }

    const move = target.casting?.move ?? target.channeling?.move ?? lastUsed.get(target);
    const state = move == null ? undefined : target.moves[move];

    return state?.disabled === false ? move : undefined;
  }

  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (event.usable && event.move === Moves.Disable) {
      event.usable =
        event.target.type === MoveTargetType.Unit &&
        getDisabledMove(event.target.unit) !== undefined;
    }
  });

  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    if (event.move !== Moves.Disable || event.target.type !== MoveTargetType.Unit) {
      return;
    }

    const target = event.target.unit;
    const move = getDisabledMove(target);

    if (move === undefined) {
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
