import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { DamageFlags, Moves } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';

const ABSORB_MOVES = new Set<Moves>([
  Moves.Absorb,
  Moves.MegaDrain,
  Moves.LeechLife,
  Moves.DreamEater,
]);

const HEALING_FACTOR = 0.5;

export default function setupAbsorb(battle: Battle): void {
  // Dream Eater only works on sleeping targets
  battle.on(BattleEvents.UnitTriggerMoveEffect, EventPriority.Pre, (event) => {
    if (
      event.move === Moves.DreamEater &&
      event.target.type === MoveTargetType.Unit &&
      event.target.unit.status[Statuses.Sleeping] == null
    ) {
      event.disabled = true;

      event.source.triggerMoveEffectFailed(event.move, event.target, event.steps);
    }
  });

  battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
    if (
      // Only the direct hit drains; indirect damage carrying the move
      // cause (e.g. a Liquid Ooze backfire) must not re-trigger it
      !(event.flags & DamageFlags.Indirect) &&
      event.cause.type === EffectType.Move &&
      ABSORB_MOVES.has(event.cause.move)
    ) {
      const amount = event.source.checkDrain(event.target, event.value * HEALING_FACTOR);

      if (amount >= 0) {
        event.source.heal(event.cause, event.source, amount, 0);
      } else {
        // The drain backfired (e.g. Liquid Ooze)
        event.source.damage(event.cause, event.source, -amount, DamageFlags.Indirect);
      }
    }
  });
}
