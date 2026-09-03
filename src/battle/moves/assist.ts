import { AttackPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import type Battle from '../core';
import { BattleEvents } from '../events';
import type Unit from '../unit';

/**
 * Assist reaches into the rest of the party and throws whatever it
 * finds: the bench's moves, not the user's own. What it cannot borrow
 * is anything that would hand something over for good, or that only
 * makes sense in the hands that own it
 * https://bulbapedia.bulbagarden.net/wiki/Assist_(move)
 */
const NOT_BORROWED = new Set<Moves>([
  Moves._Confused,
  Moves.Struggle,
  Moves.Attack,
  Moves.Assist,
  Moves.Metronome,
  Moves.MirrorMove,
  Moves.Sketch,
  Moves.Mimic,
  Moves.Counter,
  Moves.MirrorCoat,
  Moves.FocusPunch,
  Moves.Thief,
  Moves.Covet,
  Moves.Trick,
]);

function borrowable(source: Unit): Moves[] {
  const found: Moves[] = [];

  for (const unit of source.team.units) {
    if (unit === source) {
      continue;
    }
    for (const move of Object.keys(unit.moves)) {
      // The move set is keyed by the enum, which comes back as a
      // string from Object.keys
      // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
      const borrowed = Number(move) as Moves;

      if (!NOT_BORROWED.has(borrowed)) {
        found.push(borrowed);
      }
    }
  }
  return found;
}

export default function setupAssist(battle: Battle): void {
  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    if (event.move !== Moves.Assist) {
      return;
    }

    const pool = borrowable(event.source);

    if (pool.length === 0) {
      event.source.triggerMoveEffectFailed(event.move, event.target, event.steps);
      return;
    }

    const called = pool[Math.floor(battle.random() * pool.length)] ?? pool[0];
    const steps = event.source.checkMoveSteps(called, event.target);

    event.source.triggerMove(called, event.target, steps);

    if (steps > 0) {
      event.source.channel(called, event.target, steps - 1);
    }
  });

  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (event.usable && event.move === Moves.Assist) {
      event.usable = borrowable(event.source).length > 0;
    }
  });
}
