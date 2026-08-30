import { AttackPriority } from '../../core/event-emitter';
import { Stages } from '../../data/constants/stats';
import { MoveTargetPriorities, Moves } from '../../data/ids/moves';
import { checkTeamUnit } from '../ai/rating';
import type Battle from '../core';
import type { MoveTarget } from '../events';
import { BattleEvents, EffectType, MoveTargetType } from '../events';
import type Unit from '../unit';

/**
 * Multi-step moves that force a unit off the field, replaced by a
 * teammate. Whirlwind throws out the target, Teleport recalls the user.
 *
 * The first step is a wind-up delay; the final step performs the
 * actual switch. Both ends then spend a second walking to each
 * other's spots, and the move travels with them: a Teleport takes its
 * user out of the world, so it is locked out and untouchable while it
 * goes, and anything else is a walk that the fight carries on over.
 *
 * Offensive switch-outs drag in the target team's weakest unit, while
 * friendly ones bring in the strongest available. Team-wide switch-out
 * moves (none yet) would not care about the replacement and can use
 * MoveTargetPriorities.Random.
 */
export const FORCED_SWITCH_MOVES = new Set<Moves>([Moves.Whirlwind, Moves.Roar]);
const SELF_SWITCH_MOVES = new Set<Moves>([Moves.Teleport, Moves.BatonPass]);

/**
 * Every stage a Baton Pass hands over
 */
const PASSED_STAGES = [
  Stages.Attack,
  Stages.Defense,
  Stages.SpecialAttack,
  Stages.SpecialDefense,
  Stages.Speed,
  Stages.Evasion,
  Stages.Accuracy,
];

/**
 * Who the move takes off the field, and which teammate it drags in
 * after them. Nothing for a move that switches nobody
 */
function getSwitchedUnit(
  move: Moves,
  source: Unit,
  target: MoveTarget,
): { unit: Unit; priority: MoveTargetPriorities; forced: boolean } | undefined {
  if (FORCED_SWITCH_MOVES.has(move) && target.type === MoveTargetType.Unit) {
    return { unit: target.unit, priority: MoveTargetPriorities.Weakest, forced: true };
  }
  if (SELF_SWITCH_MOVES.has(move)) {
    return { unit: source, priority: MoveTargetPriorities.Strongest, forced: false };
  }
  return undefined;
}

/**
 * The teammate that would come in, if one would. A switch-out with
 * nobody left on the bench does nothing, and a friendly one is refused
 * outright when either end of the swap is trapped — forced ones drag
 * the target out whatever is holding it
 */
function getReplacement(
  battle: Battle,
  switched: { unit: Unit; priority: MoveTargetPriorities; forced: boolean },
): Unit | undefined {
  const replacement = checkTeamUnit(battle, switched.unit.team, switched.priority, switched.unit);

  if (replacement == null) {
    return undefined;
  }
  if (switched.forced || (switched.unit.checkEscape() && replacement.checkEscape())) {
    return replacement;
  }
  return undefined;
}

export default function setupSwitchOutMoves(battle: Battle): void {
  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (!event.usable) {
      return;
    }

    const switched = getSwitchedUnit(event.move, event.source, event.target);

    if (switched != null && getReplacement(battle, switched) == null) {
      event.usable = false;
    }
  });

  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    // The wind-up step; the semi-invulnerable move group handles the
    // vanishing of self switch-out users.
    if (event.steps !== 0) {
      return;
    }

    const switched = getSwitchedUnit(event.move, event.source, event.target);

    if (switched == null) {
      return;
    }

    const replacement = getReplacement(battle, switched);

    if (replacement == null) {
      event.source.triggerMoveEffectFailed(event.move, event.target, event.steps);
      return;
    }

    // What the user had built up goes with the baton, so the
    // replacement walks in on the stages rather than on nothing
    const passed =
      event.move === Moves.BatonPass
        ? PASSED_STAGES.map((stage) => switched.unit.stages[stage])
        : undefined;

    // The move goes with them: a Teleport is a vanishing and a Roar
    // is a shove, and what tells the two apart afterwards is this
    switched.unit.forceSwitch(replacement, {
      type: EffectType.Move,
      move: event.move,
      unit: event.source,
    });

    if (passed != null) {
      const cause = { type: EffectType.Move, move: Moves.BatonPass, unit: event.source } as const;

      for (const [at, stage] of PASSED_STAGES.entries()) {
        const difference = passed[at] - replacement.stages[stage];

        if (difference !== 0) {
          replacement.addStage(stage, difference, cause);
        }
      }
    }
  });
}
