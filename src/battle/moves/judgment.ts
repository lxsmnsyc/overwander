import { EventPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import { PLATES } from '../../data/items/plates';
import type Battle from '../core';
import { BattleEvents } from '../events';

/**
 * Judgment: thrown as whatever Plate the user carries, and Normal with
 * no Plate in hand. The Plate boosts it as it boosts anything of that
 * type, so the two stack the way they do in the mainline
 * https://bulbapedia.bulbagarden.net/wiki/Judgment_(move)
 */
export default function setupJudgment(battle: Battle): void {
  battle.on(BattleEvents.CheckUnitMoveType, EventPriority.Post, (event) => {
    if (event.move !== Moves.Judgment) {
      return;
    }

    for (const [plate, type] of PLATES) {
      if (event.source.hasItem(plate)) {
        event.type = type;
        return;
      }
    }
  });
}
