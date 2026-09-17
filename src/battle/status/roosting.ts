import { EventPriority } from '../../core/event-emitter';
import { Types } from '../../data/constants/types';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents } from '../events';
import turns from '../turn';
import createTimedStatus from './__create';

const DURATION = turns(1);

const setupTimer = createTimedStatus(Statuses.Roosting, DURATION);

/**
 * Roosting: the unit has put itself on the ground to rest, and its
 * Flying half counts for nothing while it is down there. That is what
 * the heal costs, and it is why Roost is a decision rather than a
 * second Recover.
 *
 * Answered where effectiveness is worked out, one defending type at a
 * time, rather than by taking the type off and putting it back:
 * neutralising the Flying half is the whole of what being on the
 * ground means, immunity to Ground included
 * https://bulbapedia.bulbagarden.net/wiki/Roost_(move)
 */
export default function setupRoostingStatus(battle: Battle): void {
  setupTimer(battle);

  battle.on(BattleEvents.UnitAttackResolveEffectiveness, EventPriority.Post, (event) => {
    if (
      event.defendingType === Types.Flying &&
      event.parent.target.status[Statuses.Roosting] != null
    ) {
      event.multiplier = 1;
    }
  });
}
