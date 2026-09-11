import { AttackPriority } from '../../core/event-emitter';
import { MoveCategories } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import { getMoveData } from '../../data/moves';
import type Battle from '../core';
import { BattleEvents, MoveTargetType } from '../events';
import turns from '../turn';
import createTimedStatus from './__create';

const DURATION = turns(2);

const setupTimer = createTimedStatus(Statuses.Coated, DURATION);

/**
 * Coated: a status move aimed at this unit goes back the way it came.
 * The coat is spent on the first one it turns, so a Magic Coat stops
 * one Toxic rather than every move for its whole run
 * https://bulbapedia.bulbagarden.net/wiki/Magic_Coat_(move)
 */
export default function setupCoatedStatus(battle: Battle): void {
  setupTimer(battle);

  battle.on(BattleEvents.UnitTriggerMoveTarget, AttackPriority.Pre, (event) => {
    if (event.target.type !== MoveTargetType.Unit) {
      return;
    }

    const aimed = event.target.unit;
    const coat = aimed.status[Statuses.Coated];

    if (
      coat == null ||
      aimed === event.source ||
      aimed.team === event.source.team ||
      getMoveData(event.move).category !== MoveCategories.Status
    ) {
      return;
    }

    aimed.removeStatus(Statuses.Coated, coat);
    event.target = { type: MoveTargetType.Unit, unit: event.source };
  });
}
