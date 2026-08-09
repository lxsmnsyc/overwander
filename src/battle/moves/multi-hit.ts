import { EventPriority } from '../../core/event-emitter';
import { MoveAttackFlags, Moves } from '../../data/ids/moves';
import { getMoveData } from '../../data/moves';
import type Battle from '../core';
import { BattleEvents, type MoveTarget, MoveTargetType } from '../events';
import type Unit from '../unit';

interface MultiHitConfig {
  min: number;
  max: number;
}

/**
 * Moves that strike several times in one use. Each strike is a full
 * attack, so per-hit secondary effects (e.g. Twineedle's poison) roll
 * on every strike.
 */
const MULTI_HIT_MOVES: { [key in Moves]?: MultiHitConfig } = {
  [Moves.FuryAttack]: { min: 2, max: 5 },
  [Moves.PinMissile]: { min: 2, max: 5 },
  [Moves.Twineedle]: { min: 2, max: 2 },
  [Moves.FurySwipes]: { min: 2, max: 5 },
  [Moves.DoubleKick]: { min: 2, max: 2 },
  [Moves.DoubleSlap]: { min: 2, max: 5 },
  [Moves.SpikeCannon]: { min: 2, max: 5 },
};

// Delay between strikes
const STRIKE_DELAY = 250;

interface MultiHitInstance {
  source: Unit;
  target: Unit;
  moveTarget: MoveTarget;
  move: Moves;
  remaining: number;
  progress: number;
}

export default function setupMultiHitMoves(battle: Battle): void {
  const instances = new Set<MultiHitInstance>();

  function strike(instance: MultiHitInstance): void {
    instance.source.attack(
      instance.target,
      instance.move,
      instance.source.checkMovePower(instance.move, instance.moveTarget) ?? 0,
      instance.source.checkMoveType(instance.move, instance.moveTarget),
      getMoveData(instance.move).category,
      MoveAttackFlags.Critical,
    );

    instance.remaining -= 1;
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

  battle.on(BattleEvents.UnitTriggerMoveEffect, EventPriority.Exact, (event) => {
    const config = MULTI_HIT_MOVES[event.move];

    if (config && event.target.type === MoveTargetType.Unit && event.steps === 0) {
      const instance: MultiHitInstance = {
        source: event.source,
        target: event.target.unit,
        moveTarget: event.target,
        move: event.move,
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
