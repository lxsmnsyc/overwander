import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import type Battle from '../core';
import { BattleEvents } from '../events';
import type Unit from '../unit';

/**
 * The moves that only work on arrival, Fake Out and Mat Block. They
 * share the one surprise an entrance buys, so throwing either spends
 * it for both
 */
const SURPRISE_MOVES = new Set<Moves>([Moves.FakeOut, Moves.MatBlock]);

/**
 * Fake Out works on somebody who has not seen it yet.
 *
 * The main games say "the turn you come in", which is a rule about
 * turn order: nothing here has turns, and a fight everybody is having
 * at once has no opening move to be. What survives the translation is
 * the surprise itself, so it is spent rather than timed: one Fake Out
 * per trip onto the field, and a pokemon that walks off and back
 * again gets its surprise back with the entrance
 * https://bulbapedia.bulbagarden.net/wiki/Fake_Out_(move)
 */
export default function setupFakeOut(battle: Battle): void {
  /** Who still has a surprise left to spend */
  const surprise = new Set<Unit>();

  battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
    if (!event.reactivation) {
      surprise.add(event.source);
    }
  });

  battle.on(BattleEvents.CheckUnitCanCast, EventPriority.Post, (event) => {
    if (event.success && SURPRISE_MOVES.has(event.move) && !surprise.has(event.source)) {
      event.success = false;
    }
  });

  // Spent on the cast rather than on the hit: a Fake Out that missed
  // was still seen coming
  battle.on(BattleEvents.UnitTriggerMove, AttackPriority.Post, (event) => {
    if (SURPRISE_MOVES.has(event.move)) {
      surprise.delete(event.source);
    }
  });

  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (event.usable && SURPRISE_MOVES.has(event.move)) {
      event.usable = surprise.has(event.source);
    }
  });

  for (const gone of [BattleEvents.UnitFaints, BattleEvents.UnitLeavesField] as const) {
    battle.on(gone, EventPriority.Post, (event) => {
      surprise.delete(event.source);
    });
  }
}
