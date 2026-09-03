import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, EffectType } from '../events';
import turns from '../turn';
import type Unit from '../unit';
import createTimedStatus from './__create';

const DURATION = turns(5);

const setupTimer = createTimedStatus(Statuses.Tormented, DURATION);

/**
 * The two fallbacks are nobody's move: locking a unit out of Struggle
 * or out of the swing it throws between cooldowns would lock it out
 * of the fight
 */
const NOT_A_MOVE = new Set<Moves>([Moves.Struggle, Moves.Attack]);

/** What each tormented unit last cast, and so cannot cast again */
const lastCast = new Map<Unit, Moves>();

/**
 * Tormented: the same move twice over is what it cannot do. Anything
 * else, including going back to the first move after a second one, is
 * allowed
 * https://bulbapedia.bulbagarden.net/wiki/Torment_(move)
 */
export default function setupTormentedStatus(battle: Battle): void {
  setupTimer(battle);

  battle.on(BattleEvents.UnitTriggerMove, AttackPriority.Post, (event) => {
    if (!NOT_A_MOVE.has(event.move)) {
      lastCast.set(event.source, event.move);
    }
  });

  battle.on(BattleEvents.CheckUnitCanCast, EventPriority.Post, (event) => {
    if (
      event.success &&
      event.source.status[Statuses.Tormented] != null &&
      lastCast.get(event.source) === event.move
    ) {
      event.success = false;

      event.source.triggerStatus(Statuses.Tormented, { type: EffectType.None });
    }
  });

  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Post, (event) => {
    if (
      event.usable &&
      event.source.status[Statuses.Tormented] != null &&
      lastCast.get(event.source) === event.move
    ) {
      event.usable = false;
    }
  });

  for (const gone of [BattleEvents.UnitFaints, BattleEvents.UnitLeavesField] as const) {
    battle.on(gone, EventPriority.Post, (event) => {
      lastCast.delete(event.source);
    });
  }
}
