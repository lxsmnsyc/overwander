import { EventPriority } from '../../core/event-emitter';
import { Stages } from '../../data/constants/stats';
import { Types } from '../../data/constants/types';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, MoveTargetType } from '../events';

/**
 * The two types a pointed-out Ghost stops being able to sit out
 */
const IGNORED_IMMUNITIES = new Set<Types>([Types.Normal, Types.Fighting]);

/**
 * Identified: the unit's evasion counts for nothing, and a Ghost can
 * be hit by the two types that normally pass straight through it
 * https://bulbapedia.bulbagarden.net/wiki/Foresight_(move)
 */
export default function setupIdentifiedStatus(battle: Battle): void {
  battle.on(BattleEvents.CheckUnitStage, EventPriority.Post, (event) => {
    if (event.stage === Stages.Evasion && event.source.status[Statuses.Identified] != null) {
      event.value = Math.min(event.value, 0);
    }
  });

  battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Post, (event) => {
    if (
      event.immune &&
      event.target.type === MoveTargetType.Unit &&
      event.target.unit.status[Statuses.Identified] != null &&
      IGNORED_IMMUNITIES.has(event.type)
    ) {
      event.immune = false;
    }
  });
}
