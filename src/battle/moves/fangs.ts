import { AttackPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, EffectType } from '../events';

/**
 * The three fangs, which bite for two things at once.
 *
 * A move carries one secondary effect through the shared resolver:
 * one chance is rolled and one thing happens. The fangs want two
 * independent rolls, so the ailment rides the ordinary table and the
 * flinch is rolled here, on the bite landing rather than on that
 * chance coming up
 * https://bulbapedia.bulbagarden.net/wiki/Fire_Fang_(move)
 */
const FANGS = new Set<Moves>([Moves.ThunderFang, Moves.IceFang, Moves.FireFang]);

const FLINCH_CHANCE = 0.1;

export default function setupFangs(battle: Battle): void {
  battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
    if (!event.success || !FANGS.has(event.move) || battle.random() >= FLINCH_CHANCE) {
      return;
    }

    event.target.addStatus(Statuses.Flinched, {
      type: EffectType.Move,
      move: event.move,
      unit: event.source,
    });
  });
}
