import { EventPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import type { Battle } from '../core';
import { BattleEvents, MoveTargetType } from '../events';
import type { Unit } from '../unit';

/**
 * Multi-step moves that force a unit off the field, replaced by a random
 * alive teammate. Whirlwind throws out the target, Teleport recalls the
 * user.
 *
 * The first step is a wind-up delay; self switch-out moves are also
 * registered as semi-invulnerable, so the user vanishes during it. The
 * final step performs the actual switch-in.
 */
const FORCED_SWITCH_MOVES = new Set<Moves>([Moves.Whirlwind]);
const SELF_SWITCH_MOVES = new Set<Moves>([Moves.Teleport]);

export function setupSwitchOutMoves(battle: Battle) {
  function pickReplacement(unit: Unit) {
    const candidates: Unit[] = [];

    for (const other of unit.team.units) {
      if (other !== unit && other.alive) {
        candidates.push(other);
      }
    }

    if (candidates.length === 0) {
      return undefined;
    }

    return candidates[Math.floor(battle.random() * candidates.length)];
  }

  battle.on(BattleEvents.UnitTriggerMoveEffect, EventPriority.Exact, event => {
    // The wind-up step; the semi-invulnerable move group handles the
    // vanishing of self switch-out users.
    if (event.steps !== 0) {
      return;
    }

    let unit: Unit | undefined;

    if (
      FORCED_SWITCH_MOVES.has(event.move) &&
      event.target.type === MoveTargetType.Unit
    ) {
      unit = event.target.unit;
    } else if (SELF_SWITCH_MOVES.has(event.move)) {
      unit = event.source;
    }

    if (!unit) {
      return;
    }

    const replacement = pickReplacement(unit);

    if (replacement) {
      unit.switch(replacement);
    } else {
      event.source.triggerMoveEffectFailed(
        event.move,
        event.target,
        event.steps,
      );
    }
  });
}
