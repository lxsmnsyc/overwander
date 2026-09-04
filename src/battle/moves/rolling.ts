import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { MoveAttackFlags, Moves } from '../../data/ids/moves';
import { getMoveData } from '../../data/moves';
import { STEP_PENALTY } from '../ai/score';
import type Battle from '../core';
import { BattleEvents, MoveTargetType } from '../events';
import type Unit from '../unit';

/**
 * The moves that build as they go: one cast that comes round again and
 * again, each pass twice as hard as the last.
 *
 * The main games run these off a streak of casts, which is a rule
 * about consecutive turns. Nothing here takes turns, and a streak in
 * real time is a streak nobody completes: something else is always off
 * cooldown. So the build is one move with steps, the way a Thrash is,
 * and the doubling happens between its own passes rather than between
 * casts.
 */
const ROLLING_MOVES = new Set<Moves>([Moves.Rollout, Moves.FuryCutter]);

/** What a Defense Curl is worth to the roll that follows it */
const CURLED_FACTOR = 2;

export default function setupRollingMoves(battle: Battle): void {
  /** How many passes each roller has already landed this cast */
  const passes = new Map<Unit, number>();
  const curled = new WeakSet<Unit>();

  battle.on(BattleEvents.UnitTriggerMove, AttackPriority.Pre, (event) => {
    if (event.move === Moves.DefenseCurl) {
      curled.add(event.source);
      return;
    }
    if (!ROLLING_MOVES.has(event.move)) {
      return;
    }

    // The steps count down, so what is behind this pass is what the
    // move started with less what is left
    const total = getMoveData(event.move).steps ?? 0;

    passes.set(event.source, Math.max(0, total - event.steps));
  });

  battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
    if (!ROLLING_MOVES.has(event.move) || event.power == null) {
      return;
    }

    event.power *= 2 ** (passes.get(event.source) ?? 0);

    if (event.move === Moves.Rollout && curled.has(event.source)) {
      event.power *= CURLED_FACTOR;
    }
  });

  // Every pass but the last strikes here; the last is the shared hit
  // handler's, the way a rampage's is
  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    if (
      !ROLLING_MOVES.has(event.move) ||
      event.steps === 0 ||
      event.target.type !== MoveTargetType.Unit
    ) {
      return;
    }

    event.source.attack(
      event.target.unit,
      event.move,
      event.source.checkMovePower(event.move, event.target) ?? 0,
      event.source.checkMoveType(event.move, event.target),
      getMoveData(event.move).category,
      MoveAttackFlags.Critical,
    );
  });

  /**
   * The passes are the move rather than a wind-up before it, so the
   * chooser's per-step charge is handed back: a roll that goes the
   * distance is the hardest thing either of these does
   */
  battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    if (ROLLING_MOVES.has(event.move)) {
      event.score += STEP_PENALTY * event.source.checkMoveSteps(event.move, event.target);
    }
  });

  function forget(unit: Unit): void {
    passes.delete(unit);
    curled.delete(unit);
  }

  for (const gone of [BattleEvents.UnitFaints, BattleEvents.UnitLeavesField] as const) {
    battle.on(gone, EventPriority.Post, (event) => {
      forget(event.source);
    });
  }
}
