import { EventPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, EffectType } from '../events';
import { onUnitActs } from '../utils';

/** What the roots draw up every time the unit reaches for a move */
const ROOTED_FRACTION = 1 / 16;

/**
 * Rooted: the unit is planted. It draws health up as it acts and
 * cannot leave the field, and unlike a bind there is no timer on it:
 * the roots are the user's own doing and they hold until it faints
 * https://bulbapedia.bulbagarden.net/wiki/Ingrain_(move)
 */
export default function setupRootedStatus(battle: Battle): void {
  onUnitActs(battle, (unit) => {
    const cause = unit.status[Statuses.Rooted];

    if (cause == null) {
      return;
    }

    unit.triggerStatus(Statuses.Rooted, cause);
    unit.heal(cause, unit, unit.checkStat(Stats.HP, 0) * ROOTED_FRACTION, 0);
  });

  battle.on(BattleEvents.CheckUnitEscape, EventPriority.Post, (event) => {
    if (event.success && event.source.status[Statuses.Rooted] != null) {
      event.success = false;

      event.source.triggerStatus(Statuses.Rooted, { type: EffectType.None });
    }
  });
}
