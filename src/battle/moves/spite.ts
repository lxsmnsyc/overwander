import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import type Battle from '../core';
import { BattleEvents, MoveTargetType } from '../events';
import type Unit from '../unit';

/**
 * How much longer the spited move takes to come round. PP here is how
 * often a move comes back, so what the mainline takes off the count
 * is taken off the clock instead
 */
const COOLDOWN_FACTOR = 4;

const NOT_A_MOVE = new Set<Moves>([Moves.Struggle, Moves.Attack, Moves.Spite]);

const SPITES = new WeakMap<Battle, (target: Unit) => boolean>();

/**
 * Spite a unit from something other than Spite itself (G-Max
 * Depletion), answering whether it had a move to stretch
 */
export function spiteUnit(battle: Battle, target: Unit): boolean {
  return SPITES.get(battle)?.(target) ?? false;
}

export default function setupSpite(battle: Battle): void {
  const lastUsed = new Map<Unit, Moves>();

  battle.on(BattleEvents.UnitTriggerMove, AttackPriority.Post, (event) => {
    if (!NOT_A_MOVE.has(event.move)) {
      lastUsed.set(event.source, event.move);
    }
  });

  battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
    lastUsed.delete(event.source);
  });

  battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
    lastUsed.delete(event.source);
  });

  function getSpitedMove(target: Unit): Moves | undefined {
    const move = target.casting?.move ?? target.channeling?.move ?? lastUsed.get(target);

    return move != null && target.moves[move] != null ? move : undefined;
  }

  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (event.usable && event.move === Moves.Spite) {
      event.usable =
        event.target.type === MoveTargetType.Unit && getSpitedMove(event.target.unit) !== undefined;
    }
  });

  /** Stretches the target's last move's wait, or says there was nothing to stretch */
  function spite(target: Unit): boolean {
    const move = getSpitedMove(target);

    if (move === undefined) {
      return false;
    }

    // A move already cooling has its wait stretched; one that is ready
    // is put on a cooldown it has to sit out first
    if (target.moves[move]?.cooldown == null) {
      target.startCooldown(move, { type: MoveTargetType.Unit, unit: target });
    }

    const cooldown = target.moves[move]?.cooldown;

    if (cooldown != null) {
      target.updateCooldown(move, { duration: cooldown.duration * COOLDOWN_FACTOR });
    }
    return true;
  }

  SPITES.set(battle, spite);

  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    if (event.move !== Moves.Spite || event.target.type !== MoveTargetType.Unit) {
      return;
    }

    if (!spite(event.target.unit)) {
      event.source.triggerMoveEffectFailed(event.move, event.target, event.steps);
    }
  });

  // Eerie Spell does the same to whatever it lands on, every time it lands
  battle.on(BattleEvents.CheckUnitAttackEffectChance, EventPriority.Post, (event) => {
    if (event.parent.move === Moves.EerieSpell) {
      event.value = 100;
    }
  });

  battle.on(BattleEvents.UnitAttackEffect, EventPriority.Exact, (event) => {
    if (event.parent.move === Moves.EerieSpell && event.parent.target.alive) {
      spite(event.parent.target);
    }
  });
}
