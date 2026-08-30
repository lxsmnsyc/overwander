import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import { DamageFlags, Moves } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import { HEAL_BONUS } from '../ai/score';
import type Battle from '../core';
import type { MoveTarget } from '../events';
import { BattleEvents, EffectType, MoveTargetType } from '../events';
import { hasAnyStatus } from '../utils';

/**
 * The moves that take health back from what they hit. Exported so an
 * ability that turns a drain against its user (Liquid Ooze) can say
 * which moves it is talking about without keeping its own list
 */
export const ABSORB_MOVES = new Set<Moves>([
  Moves.Absorb,
  Moves.MegaDrain,
  Moves.LeechLife,
  Moves.DreamEater,
  Moves.GigaDrain,
]);

const HEALING_FACTOR = 0.5;

/**
 * The share of its health below which a unit values the drain as well
 * as the hit
 */
const HURTING = 0.5;

/**
 * What a drain is worth on top of its damage. Under a real heal: it
 * gives back half of what it deals, and the AI has already scored the
 * dealing
 */
const DRAIN_BONUS = Math.round(HEAL_BONUS / 2);

/**
 * What counts as having a dream to eat. A dormant boss is not asleep,
 * but it is not awake either — and a raid where the move is dead
 * weight against the only thing in the room is a raid where nobody
 * brings it
 */
const DREAMING = new Set<Statuses>([Statuses.Sleeping, Statuses.Dormant]);

/**
 * Dream Eater eats a dream, so there has to be one: it does nothing at
 * all to a target that is awake
 */
function isDreamEaterUsable(target: MoveTarget): boolean {
  return target.type === MoveTargetType.Unit && hasAnyStatus(target.unit, DREAMING);
}

export default function setupAbsorb(battle: Battle): void {
  // The AI is told the same thing the trigger below enforces, so it
  // never picks Dream Eater against somebody who is awake
  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (event.usable && event.move === Moves.DreamEater && !isDreamEaterUsable(event.target)) {
      event.usable = false;
    }
  });

  // Dream Eater only works on sleeping targets. It is answered as a
  // verdict rather than by disabling the event: the gate that asks
  // this is what reports the failure
  battle.on(BattleEvents.CheckUnitTriggerMoveEffect, EventPriority.Exact, (event) => {
    if (event.success && event.move === Moves.DreamEater && !isDreamEaterUsable(event.target)) {
      event.success = false;
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

  // A drain is a hit that heals, so it is worth more than the hit
  // alone to a user with room to take the health back
  battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    if (!ABSORB_MOVES.has(event.move)) {
      return;
    }

    const source = event.source;

    if (source.health < source.checkStat(Stats.HP, 0) * HURTING) {
      event.score += DRAIN_BONUS;
    }
  });
}
