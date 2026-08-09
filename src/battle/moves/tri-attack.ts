import { EventPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, EffectType } from '../events';

// https://bulbapedia.bulbagarden.net/wiki/Tri_Attack_(move)
export default function setupTriAttack(battle: Battle): void {
  const CHANCE = 20;
  const STATUSES = [Statuses.Burned, Statuses.Frozen, Statuses.Paralyzed];

  battle.on(BattleEvents.CheckUnitAttackEffectChance, EventPriority.Post, (event) => {
    if (event.parent.move === Moves.TriAttack) {
      event.value = CHANCE;
    }
  });

  // One of the three afflictions, evenly rolled
  battle.on(BattleEvents.UnitAttackEffect, EventPriority.Exact, (event) => {
    if (event.parent.move === Moves.TriAttack) {
      const status = STATUSES[Math.floor(battle.random() * STATUSES.length)];

      event.parent.target.addStatus(status, {
        type: EffectType.Move,
        move: event.parent.move,
        unit: event.parent.source,
      });
    }
  });
}
