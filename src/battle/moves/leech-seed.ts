import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Types } from '../../data/constants/types';
import { Moves } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';

export default function setupLeechSeed(battle: Battle): void {
  battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Post, (event) => {
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
    if (event.move === Moves.LeechSeed && event.target.type === MoveTargetType.Unit) {
      event.target.unit.addStatus(Statuses.Seeding, {
        type: EffectType.Move,
        unit: event.source,
        move: event.move,
      });
    }
  });

  // Sappy Seed plants one as it hits. A Grass type takes the hit and
  // not the seed, the way it shrugs off Leech Seed
  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    if (event.move !== Moves.SappySeed || event.target.type !== MoveTargetType.Unit) {
      return;
    }

    const target = event.target.unit;

    if (!target.types.has(Types.Grass) && !target.getStatus(Statuses.Seeding)) {
      target.addStatus(Statuses.Seeding, {
        type: EffectType.Move,
        unit: event.source,
        move: event.move,
      });
    }
  });
}
