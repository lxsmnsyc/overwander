import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import { getMoveData } from '../../data/moves';
import { RECHARGE_MOVES } from '../../data/moves/recharge';
import type Battle from '../core';
import { BattleEvents, type MoveTarget, MoveTargetType } from '../events';
import type Unit from '../unit';

/**
 * Instruct makes the target throw the move it threw last again, at
 * once and at the same target. It will not repeat a move that winds up
 * over several steps, one that has to recharge, one that waits on being
 * hit, or itself
 * https://bulbapedia.bulbagarden.net/wiki/Instruct_(move)
 */
const NOT_REPEATED = new Set<Moves>([
  Moves.Instruct,
  Moves.FocusPunch,
  Moves.BeakBlast,
  Moves.ShellTrap,
  Moves.Bide,
  Moves.Struggle,
]);

function repeatable(move: Moves): boolean {
  return (
    !NOT_REPEATED.has(move) && !RECHARGE_MOVES.has(move) && (getMoveData(move).steps ?? 0) === 0
  );
}

export default function setupInstruct(battle: Battle): void {
  /** The move each unit threw last, and at what */
  const last = new Map<Unit, { move: Moves; target: MoveTarget }>();

  battle.on(BattleEvents.UnitTriggerMove, AttackPriority.Post, (event) => {
    if (event.move !== Moves.Instruct) {
      last.set(event.source, { move: event.move, target: event.target });
    }
  });

  function repeatOf(unit: Unit): { move: Moves; target: MoveTarget } | null {
    const thrown = last.get(unit);

    if (thrown == null || !repeatable(thrown.move)) {
      return null;
    }
    if (thrown.target.type === MoveTargetType.Unit && !thrown.target.unit.alive) {
      return null;
    }
    return thrown;
  }

  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    if (event.move !== Moves.Instruct || event.target.type !== MoveTargetType.Unit) {
      return;
    }

    const target = event.target.unit;
    const thrown = repeatOf(target);

    if (thrown == null) {
      event.source.triggerMoveEffectFailed(event.move, event.target, event.steps);
      return;
    }
    target.triggerMove(thrown.move, thrown.target, 0);
  });

  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (event.usable && event.move === Moves.Instruct) {
      event.usable =
        event.target.type === MoveTargetType.Unit && repeatOf(event.target.unit) != null;
    }
  });

  for (const gone of [BattleEvents.UnitFaints, BattleEvents.UnitLeavesField] as const) {
    battle.on(gone, EventPriority.Post, (event) => {
      last.delete(event.source);
    });
  }
}
