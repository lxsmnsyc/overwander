import { EventPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, MoveTargetType } from '../events';

// https://bulbapedia.bulbagarden.net/wiki/Body_Slam_(move)
export default function setupBodySlam(battle: Battle): void {
  battle.on(BattleEvents.CheckUnitMoveAccuracy, EventPriority.Post, (event) => {
    if (
      event.move === Moves.BodySlam &&
      event.target.type === MoveTargetType.Unit &&
      event.target.unit.status[Statuses.Minimized] &&
      !event.target.unit.status[Statuses.Invulnerable]
    ) {
      event.accuracy = undefined;
    }
  });
  battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
    if (event.parent.move === Moves.BodySlam && event.parent.target.status[Statuses.Minimized]) {
      event.value *= 2;
    }
  });
}
