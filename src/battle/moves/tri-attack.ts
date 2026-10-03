import { EventPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, EffectType } from '../events';

/**
 * The moves that land one of three afflictions, evenly rolled: Tri
 * Attack's fire, ice and lightning, and Dire Claw's poison, paralysis
 * and sleep
 * https://bulbapedia.bulbagarden.net/wiki/Tri_Attack_(move)
 * https://bulbapedia.bulbagarden.net/wiki/Dire_Claw_(move)
 */
const ROLLS = new Map<Moves, { chance: number; statuses: Statuses[] }>([
  [
    Moves.TriAttack,
    { chance: 20, statuses: [Statuses.Burned, Statuses.Frozen, Statuses.Paralyzed] },
  ],
  [
    Moves.DireClaw,
    { chance: 50, statuses: [Statuses.Poisoned, Statuses.Paralyzed, Statuses.Sleeping] },
  ],
]);

export default function setupTriAttack(battle: Battle): void {
  battle.on(BattleEvents.CheckUnitAttackEffectChance, EventPriority.Post, (event) => {
    const roll = ROLLS.get(event.parent.move);

    if (roll != null) {
      event.value = roll.chance;
    }
  });

  battle.on(BattleEvents.UnitAttackEffect, EventPriority.Exact, (event) => {
    const roll = ROLLS.get(event.parent.move);

    if (roll != null) {
      const status = roll.statuses[Math.floor(battle.random() * roll.statuses.length)];

      event.parent.target.addStatus(status, {
        type: EffectType.Move,
        move: event.parent.move,
        unit: event.parent.source,
      });
    }
  });
}
