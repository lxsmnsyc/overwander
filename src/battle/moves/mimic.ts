import { AttackPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import type Battle from '../core';
import { BattleEvents, MoveTargetType } from '../events';
import type Unit from '../unit';

const BANNED_MOVES = new Set<Moves>([
  // Struggle is not a move to be copied: it is what the engine
  // reaches for when a unit has nothing, and a unit that mimicked it
  // would be carrying a move that costs a quarter of its health and
  // shuts the fallback off by being the one move it still knows
  Moves.Struggle,
  // And Attack for the other half of that: a mimicked swing would
  // fill a move slot with the thing a pokemon already does for free
  // whenever it has nothing better
  Moves.Attack,
]);

export default function setupMimic(battle: Battle): void {
  const lastCast = new Map<Unit, Moves>();

  battle.on(BattleEvents.UnitTriggerMove, AttackPriority.Post, (event) => {
    if (!BANNED_MOVES.has(event.move)) {
      lastCast.set(event.source, event.move);
    }
  });

  // Mimic copies the target's last move, so it needs one to copy that
  // the user does not already know
  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (event.usable && event.move === Moves.Mimic) {
      const copied =
        event.target.type === MoveTargetType.Unit ? lastCast.get(event.target.unit) : undefined;

      event.usable = copied != null && event.source.moves[copied] == null;
    }
  });

  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    if (event.move === Moves.Mimic) {
      if (event.target.type === MoveTargetType.Unit) {
        const targetMove = lastCast.get(event.target.unit);

        if (targetMove && !event.source.moves[targetMove]) {
          event.source.finishCooldown(Moves.Mimic);
          event.source.removeMove(Moves.Mimic);
          event.source.addMove(targetMove);
          return;
        }
      }
      event.source.triggerMoveEffectFailed(Moves.Mimic, event.target, event.steps);
    }
  });
}
