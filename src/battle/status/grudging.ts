import { AttackPriority, EventPriority } from '../../core/event-emitter';
import type { Moves } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, EffectType } from '../events';
import turns from '../turn';
import type Unit from '../unit';
import createTimedStatus from './__create';

const DURATION = turns(5);

/**
 * How long the move that took the grudge stays gone. PP is a cooldown
 * here, so a move nobody may use again is one that does not come back
 * inside the fight
 */
const SPENT = turns(60);

const setupTimer = createTimedStatus(Statuses.Grudging, DURATION);

/** Who last hit each unit with a move, and which move it was */
const struckBy = new Map<Unit, { unit: Unit; move: Moves }>();

/**
 * Grudging: whoever knocks this unit out loses the move that did it
 * https://bulbapedia.bulbagarden.net/wiki/Grudge_(move)
 */
export default function setupGrudgingStatus(battle: Battle): void {
  setupTimer(battle);

  battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
    if (event.success && event.cause.type === EffectType.Move) {
      struckBy.set(event.target, { unit: event.cause.unit, move: event.cause.move });
    }
  });

  battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
    const cause = event.source.status[Statuses.Grudging];
    const killer = struckBy.get(event.source);

    struckBy.delete(event.source);

    if (cause == null || killer == null || !killer.unit.alive) {
      return;
    }
    if (killer.unit.moves[killer.move] != null) {
      killer.unit.updateCooldown(killer.move, { progress: 0, duration: SPENT });
    }
  });

  battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
    struckBy.delete(event.source);
  });
}
