import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import type Battle from '../core';
import { BattleEvents } from '../events';
import type Unit from '../unit';

/**
 * Autotomize sheds weight as well as raising Speed, which the stage
 * group does. The weight comes back once the user leaves the field
 * https://bulbapedia.bulbagarden.net/wiki/Autotomize_(move)
 */
const SHED = 100;
const LIGHTEST = 0.1;

export default function setupAutotomize(battle: Battle): void {
  const shed = new Map<Unit, number>();

  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    if (event.move === Moves.Autotomize) {
      shed.set(event.source, (shed.get(event.source) ?? 0) + 1);
    }
  });

  battle.on(BattleEvents.CheckUnitWeight, EventPriority.Post, (event) => {
    const times = shed.get(event.source);

    if (times != null) {
      event.weight = Math.max(LIGHTEST, event.weight - SHED * times);
    }
  });

  for (const gone of [BattleEvents.UnitFaints, BattleEvents.UnitLeavesField] as const) {
    battle.on(gone, EventPriority.Post, (event) => {
      shed.delete(event.source);
    });
  }
}
