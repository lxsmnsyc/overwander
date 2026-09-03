import { AttackPriority } from '../../core/event-emitter';
import { MoveCategories } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import { getMoveData } from '../../data/moves';
import type Battle from '../core';
import { BattleEvents, MoveTargetType } from '../events';
import turns from '../turn';
import createTimedStatus from './__create';

const DURATION = turns(2);

const setupTimer = createTimedStatus(Statuses.Snatching, DURATION);

/**
 * Snatching: the next move somebody casts on themselves is taken by
 * the waiting unit instead. A Swords Dance, a Recover, a Calm Mind:
 * whatever it was, it happens to the snatcher
 * https://bulbapedia.bulbagarden.net/wiki/Snatch_(move)
 */
export default function setupSnatchingStatus(battle: Battle): void {
  setupTimer(battle);

  battle.on(BattleEvents.UnitTriggerMoveTarget, AttackPriority.Pre, (event) => {
    const selfCast =
      event.target.type !== MoveTargetType.Unit || event.target.unit === event.source;

    if (
      !selfCast ||
      event.source.status[Statuses.Snatching] != null ||
      getMoveData(event.move).category !== MoveCategories.Status
    ) {
      return;
    }

    for (const team of battle.teams()) {
      for (const unit of team.units) {
        const waiting = unit.status[Statuses.Snatching];

        if (waiting == null || !unit.alive || unit.team === event.source.team) {
          continue;
        }

        unit.removeStatus(Statuses.Snatching, waiting);
        event.target = { type: MoveTargetType.Unit, unit };
        return;
      }
    }
  });
}
