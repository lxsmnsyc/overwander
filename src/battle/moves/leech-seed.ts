import { EventPriority } from '../../core/event-emitter';
import { Types } from '../../data/constants/types';
import { Moves } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import type { Battle } from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';

export function setupLeechSeed(battle: Battle) {
  battle.on(BattleEvents.CheckMoveImmunity, EventPriority.Post, event => {
    // TODO Sappy Seed
    if (!event.immune && event.move === Moves.LeechSeed) {
      event.immune =
        event.target.types.has(Types.Grass) ||
        !!event.target.getStatus(Statuses.Seeding);
    }
  });

  battle.on(BattleEvents.TriggerMoveEffect, EventPriority.Exact, event => {
    // TODO Sappy Seed
    if (
      event.move === Moves.LeechSeed &&
      event.target.type === MoveTargetType.Unit
    ) {
      event.target.unit.addStatus(Statuses.Seeding, {
        type: EffectType.Move,
        unit: event.source,
        move: event.move,
      });
    }
  });
}
