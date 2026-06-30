import { EventPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import type { Battle } from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';

const STATUS_MOVES: { [key in Moves]?: Statuses } = {
  [Moves.PoisonPowder]: Statuses.Poisoned,
  [Moves.Toxic]: Statuses.BadlyPoisoned,
};

const EFFECT_STATUS_MOVES: { [key in Moves]?: Statuses } = {
  [Moves.BodySlam]: Statuses.Paralyzed,
};

const EFFECT_STATUS_CHANCE: { [key in Moves]?: number } = {
  [Moves.BodySlam]: 30,
};

function setupUnitStatusMoves(battle: Battle) {
  battle.on(BattleEvents.UnitTriggerMoveEffect, EventPriority.Exact, event => {
    const targetStatus = STATUS_MOVES[event.move];

    if (targetStatus && event.target.type === MoveTargetType.Unit) {
      event.target.unit.addStatus(targetStatus, {
        type: EffectType.Move,
        move: event.move,
        unit: event.source,
      });
    }
  });

  battle.on(
    BattleEvents.CheckUnitAttackEffectChance,
    EventPriority.Post,
    event => {
      event.value = EFFECT_STATUS_CHANCE[event.parent.move] ?? 0;
    },
  );

  battle.on(BattleEvents.UnitAttackEffect, EventPriority.Exact, event => {
    const status = EFFECT_STATUS_MOVES[event.parent.move];

    if (status) {
      event.parent.target.addStatus(status, {
        type: EffectType.Move,
        move: event.parent.move,
        unit: event.parent.source,
      });
    }
  });
}

export function setupStatusMoves(battle: Battle) {
  setupUnitStatusMoves(battle);
}
