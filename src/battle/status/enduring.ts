import { AttackPriority } from '../../core/event-emitter';
import { DamageFlags } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, EffectType } from '../events';
import turns from '../turn';
import createTimedStatus from './__create';

const DURATION = turns(1);

const setupTimer = createTimedStatus(Statuses.Enduring, DURATION);

/**
 * Braced: nothing can put the unit below 1 HP while it holds. The
 * flag is added before the damage is applied, so whatever lands is
 * still felt, it just cannot finish it
 * https://bulbapedia.bulbagarden.net/wiki/Endure_(move)
 */
export default function setupEnduringStatus(battle: Battle): void {
  setupTimer(battle);

  battle.on(BattleEvents.UnitDamage, AttackPriority.Pre, (event) => {
    if (event.target.status[Statuses.Enduring] != null) {
      event.flags |= DamageFlags.NonLethal;
    }
  });

  battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
    if (event.success && event.target.status[Statuses.Enduring] != null) {
      event.target.triggerStatus(Statuses.Enduring, { type: EffectType.None });
    }
  });
}
