import { EventPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents } from '../events';

/**
 * PowerTricked: the unit's Attack and Defense have changed places.
 *
 * Read at the stat rather than written into it, so everything that
 * reads a stat sees the swap and nothing has to be put back: a unit
 * that leaves the field loses the status and is itself again
 * https://bulbapedia.bulbagarden.net/wiki/Power_Trick_(move)
 */
/** The two that change places, read from either side */
const SWAPPED = new Map<Stats, Stats>([
  [Stats.Attack, Stats.Defense],
  [Stats.Defense, Stats.Attack],
]);

export default function setupPowerTrickedStatus(battle: Battle): void {
  // Asking for the partner stat comes straight back through here, so
  // the swap stands aside while it answers: what Attack wants is what
  // Defense would have been worth untricked
  let swapping = false;

  battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
    if (swapping || event.source.status[Statuses.PowerTricked] == null) {
      return;
    }

    const partner = SWAPPED.get(event.stat);

    if (partner == null) {
      return;
    }
    swapping = true;
    try {
      event.value = event.source.checkStat(partner, 0);
    } finally {
      swapping = false;
    }
  });
}
