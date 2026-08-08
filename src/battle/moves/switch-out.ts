import { EventPriority } from '../../core/event-emitter';
import { Moves, MoveTargetPriorities } from '../../data/ids/moves';
import { checkTeamUnit } from '../ai/rating';
import type { Battle } from '../core';
import { BattleEvents, MoveTargetType } from '../events';
import type { Unit } from '../unit';

/**
 * Multi-step moves that force a unit off the field, replaced by a
 * teammate. Whirlwind throws out the target, Teleport recalls the user.
 *
 * The first step is a wind-up delay; self switch-out moves are also
 * registered as semi-invulnerable, so the user vanishes during it. The
 * final step performs the actual switch-in.
 *
 * Offensive switch-outs drag in the target team's weakest unit, while
 * friendly ones bring in the strongest available. Team-wide switch-out
 * moves (none yet) would not care about the replacement and can use
 * MoveTargetPriorities.Random.
 */
const FORCED_SWITCH_MOVES = new Set<Moves>([Moves.Whirlwind, Moves.Roar]);
const SELF_SWITCH_MOVES = new Set<Moves>([Moves.Teleport]);

export function setupSwitchOutMoves(battle: Battle) {
  battle.on(BattleEvents.UnitTriggerMoveEffect, EventPriority.Exact, event => {
    // The wind-up step; the semi-invulnerable move group handles the
    // vanishing of self switch-out users.
    if (event.steps !== 0) {
      return;
    }

    let unit: Unit | undefined;
    let priority: MoveTargetPriorities | undefined;
    let forced = false;

    if (
      FORCED_SWITCH_MOVES.has(event.move) &&
      event.target.type === MoveTargetType.Unit
    ) {
      unit = event.target.unit;
      priority = MoveTargetPriorities.Weakest;
      forced = true;
    } else if (SELF_SWITCH_MOVES.has(event.move)) {
      unit = event.source;
      priority = MoveTargetPriorities.Strongest;
    }

    if (unit == null || priority == null) {
      return;
    }

    const replacement = checkTeamUnit(battle, unit.team, priority, unit);

    /**
     * Forced switch-outs bypass trapping; friendly ones fail unless
     * both the leaving unit and its replacement can escape.
     */
    const canSwitch =
      replacement != null &&
      (forced || (unit.checkEscape() && replacement.checkEscape()));

    if (canSwitch && replacement) {
      unit.forceSwitch(replacement);
    } else {
      event.source.triggerMoveEffectFailed(
        event.move,
        event.target,
        event.steps,
      );
    }
  });
}
