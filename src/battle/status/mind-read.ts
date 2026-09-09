import { EventPriority } from '../../core/event-emitter';
import { Stages } from '../../data/constants/stats';
import { Types } from '../../data/constants/types';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, MoveTargetType } from '../events';

/**
 * MindRead: the unit has been read, so its evasion counts for nothing
 * and a Dark type can no longer sit out the Psychic moves that
 * normally pass straight through it.
 *
 * The same shape as Identified, and deliberately a status of its own:
 * Foresight opens a Ghost to Normal and Fighting, and one move opening
 * a target to everything is not what either was for
 * https://bulbapedia.bulbagarden.net/wiki/Miracle_Eye_(move)
 */
export default function setupMindReadStatus(battle: Battle): void {
  battle.on(BattleEvents.CheckUnitStage, EventPriority.Post, (event) => {
    if (event.stage === Stages.Evasion && event.source.status[Statuses.MindRead] != null) {
      event.value = Math.min(event.value, 0);
    }
  });

  battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Post, (event) => {
    if (
      event.immune &&
      event.target.type === MoveTargetType.Unit &&
      event.target.unit.status[Statuses.MindRead] != null &&
      event.type === Types.Psychic
    ) {
      event.immune = false;
    }
  });
}
