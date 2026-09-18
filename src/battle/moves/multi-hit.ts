import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { MoveAttackFlags, type Moves } from '../../data/ids/moves';
import { getMoveData } from '../../data/moves';
import { MULTI_HIT_MOVES, type MultiHitConfig, estimateMoveHits } from '../../data/moves/multi-hit';
import type Battle from '../core';
import { BattleEvents, type MoveTarget, MoveTargetType } from '../events';
import type Unit from '../unit';

// The list and the estimate are data, since the expert builder reads
// them as well; re-exported here because the battle side is where
// everything else looks for them
export { MULTI_HIT_MOVES, estimateMoveHits };

// Delay between strikes
const STRIKE_DELAY = 250;

interface MultiHitInstance {
  source: Unit;
  /** Which strike is next, counting from one */
  strike: number;
  target: Unit;
  moveTarget: MoveTarget;
  move: Moves;
  remaining: number;
  progress: number;
}

export default function setupMultiHitMoves(battle: Battle): void {
  const instances = new Set<MultiHitInstance>();

  function strike(instance: MultiHitInstance): void {
    const power = instance.source.checkMovePower(instance.move, instance.moveTarget) ?? 0;
    const escalating = MULTI_HIT_MOVES[instance.move]?.escalating === true;

    instance.source.attack(
      instance.target,
      instance.move,
      escalating ? power * instance.strike : power,
      instance.source.checkMoveType(instance.move, instance.moveTarget),
      getMoveData(instance.move).category,
      MoveAttackFlags.Critical,
    );

    instance.remaining -= 1;
    instance.strike += 1;
  }

  function isFinished(instance: MultiHitInstance): boolean {
    return instance.remaining <= 0 || !(instance.source.alive && instance.target.alive);
  }

  const timer = battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
    for (const instance of instances) {
      instance.progress += event.duration;

      while (instance.progress >= STRIKE_DELAY && !isFinished(instance)) {
        instance.progress -= STRIKE_DELAY;

        strike(instance);
      }

      if (isFinished(instance)) {
        instances.delete(instance);

        if (instances.size === 0) {
          timer.stop();
        }
      }
    }
  });

  timer.stop();

  function cancel(source: Unit): void {
    for (const instance of instances) {
      if (instance.source === source) {
        instances.delete(instance);
      }
    }

    if (instances.size === 0) {
      timer.stop();
    }
  }

  // Remaining strikes are interrupted the same way move usage is
  battle.on(BattleEvents.UnitInterrupt, EventPriority.Post, (event) => {
    cancel(event.source);
  });

  battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
    cancel(event.source);
  });

  function rollHitCount(config: MultiHitConfig): number {
    if (config.min === config.max) {
      return config.min;
    }

    /**
     * Modern 2-5 hit distribution:
     * 2 hits 35%, 3 hits 35%, 4 hits 15%, 5 hits 15%
     */
    const roll = battle.random();

    if (roll < 0.35) {
      return 2;
    }
    if (roll < 0.7) {
      return 3;
    }
    if (roll < 0.85) {
      return 4;
    }
    return 5;
  }

  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    const config = MULTI_HIT_MOVES[event.move];

    if (config && event.target.type === MoveTargetType.Unit && event.steps === 0) {
      const instance: MultiHitInstance = {
        source: event.source,
        target: event.target.unit,
        moveTarget: event.target,
        move: event.move,
        strike: 1,
        // The roll resolves through the event engine so abilities
        // (e.g. Skill Link) can adjust it
        remaining: event.source.checkMoveHits(
          event.move,
          event.target,
          rollHitCount(config),
          config.max,
        ),
        progress: 0,
      };

      // First strike lands immediately, the rest follow on a delay
      strike(instance);

      if (!isFinished(instance)) {
        instances.add(instance);

        if (instances.size === 1) {
          timer.start();
        }
      }
    }
  });
}
