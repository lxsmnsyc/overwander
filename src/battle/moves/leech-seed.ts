import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Types } from '../../data/constants/types';
import { Moves } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';

export default function setupLeechSeed(battle: Battle): void {
  battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Post, (event) => {
    // TODO Sappy Seed
    if (
      !event.immune &&
      event.move === Moves.LeechSeed &&
      event.target.type === MoveTargetType.Unit
    ) {
      event.immune =
        event.target.unit.types.has(Types.Grass) || !!event.target.unit.getStatus(Statuses.Seeding);
    }
  });

  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    // TODO Sappy Seed
    if (event.move === Moves.LeechSeed && event.target.type === MoveTargetType.Unit) {
      event.target.unit.addStatus(Statuses.Seeding, {
        type: EffectType.Move,
        unit: event.source,
        move: event.move,
      });
    }
  });
}
