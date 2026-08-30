import { EventPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import { DamageFlags } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, EffectType } from '../events';
import { onUnitActs } from '../utils';

/**
 * What a nightmare costs every time the sleeper stirs
 */
const NIGHTMARE_FRACTION = 0.25;

/**
 * A nightmare only holds while the unit is asleep: it is paid when
 * the sleeper would act, and it lifts the moment it wakes
 * https://bulbapedia.bulbagarden.net/wiki/Nightmare_(move)
 */
export default function setupNightmaredStatus(battle: Battle): void {
  onUnitActs(battle, (unit) => {
    const cause = unit.status[Statuses.Nightmared];

    if (cause == null) {
      return;
    }
    if (unit.status[Statuses.Sleeping] == null) {
      unit.removeStatus(Statuses.Nightmared, cause);
      return;
    }

    unit.triggerStatus(Statuses.Nightmared, cause);

    const amount = unit.checkStat(Stats.HP, 0) * NIGHTMARE_FRACTION;
    const source = cause.type === EffectType.None ? unit : cause.unit;

    source.damage(cause, unit, amount, DamageFlags.Indirect | DamageFlags.HealthScaled);
  });

  // Waking up ends it even if the unit never gets to act again
  battle.on(BattleEvents.UnitRemoveStatus, EventPriority.Post, (event) => {
    const cause = event.source.status[Statuses.Nightmared];

    if (event.status === Statuses.Sleeping && cause != null) {
      event.source.removeStatus(Statuses.Nightmared, cause);
    }
  });

  // Only a sleeper can be given one
  battle.on(BattleEvents.CheckUnitStatusImmunity, EventPriority.Exact, (event) => {
    if (
      !event.immune &&
      event.status === Statuses.Nightmared &&
      event.source.status[Statuses.Sleeping] == null
    ) {
      event.immune = true;
    }
  });
}
