import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { MoveCategories } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import { getMoveData } from '../../data/moves';
import type Battle from '../core';
import { BattleEvents, EffectType } from '../events';
import turns from '../turn';
import createTimedStatus from './__create';

const DURATION = turns(5);

const setupTimer = createTimedStatus(Statuses.Taunted, DURATION);

/**
 * Taunted: nothing but attacks while it holds. A pokemon that was
 * setting up, healing or putting a screen down is left with the
 * moves it can hit with
 * https://bulbapedia.bulbagarden.net/wiki/Taunt_(move)
 */
export default function setupTauntedStatus(battle: Battle): void {
  setupTimer(battle);

  battle.on(BattleEvents.CheckUnitCanCast, EventPriority.Post, (event) => {
    if (
      event.success &&
      event.source.status[Statuses.Taunted] != null &&
      getMoveData(event.move).category === MoveCategories.Status
    ) {
      event.success = false;

      event.source.triggerStatus(Statuses.Taunted, { type: EffectType.None });
    }
  });

  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Post, (event) => {
    if (
      event.usable &&
      event.source.status[Statuses.Taunted] != null &&
      getMoveData(event.move).category === MoveCategories.Status
    ) {
      event.usable = false;
    }
  });
}
