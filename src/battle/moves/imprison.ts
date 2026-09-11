import { AttackPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import type Battle from '../core';
import { BattleEvents, MoveTargetType } from '../events';
import { setImprisonedMoves } from '../status/imprisoned';

/**
 * Imprison seals what the two have in common. The status itself is
 * applied by the status move table; what is left here is deciding
 * which moves it covers, which is read when the seal lands rather
 * than when the target reaches for one
 * https://bulbapedia.bulbagarden.net/wiki/Imprison_(move)
 */
export default function setupImprison(battle: Battle): void {
  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Pre, (event) => {
    if (event.move !== Moves.Imprison || event.target.type !== MoveTargetType.Unit) {
      return;
    }

    const shared = Object.keys(event.source.moves)
      // The move set is keyed by the enum, which comes back as a
      // string from Object.keys
      // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
      .map((move) => Number(move) as Moves)
      .filter((move) => event.target.type === MoveTargetType.Unit && event.target.unit.moves[move]);

    setImprisonedMoves(event.target.unit, shared);
  });
}
