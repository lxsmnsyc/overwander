import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import { Moves } from '../../data/ids/moves';
import { STEP_PENALTY, USELESS_PENALTY } from '../ai/score';
import type Battle from '../core';
import { BattleEvents, EffectType } from '../events';
import type Unit from '../unit';

/**
 * Stockpile and the two moves that spend it.
 *
 * The charges are the whole mechanic: Spit Up and Swallow are worth
 * exactly what has been put away, and spending empties the store, so
 * a pokemon cannot bank once and cash twice.
 *
 * Stockpile fills the store in one cast rather than three. It is a
 * multi-step move, a charge and a pair of stages per step, because a
 * fight in real time gives nobody three uninterrupted casts to bank
 * with: something would always be off cooldown and worth spending the
 * store on first, and three was a number nothing ever reached. An
 * interrupted cast keeps whatever it managed to put away.
 */
const MAX_CHARGES = 3;

/** What a Spit Up is worth for each charge behind it */
const POWER_PER_CHARGE = 100;

/** What a Swallow puts back at one, two and three charges */
const SWALLOW_SHARES = [0.25, 0.5, 1];

export default function setupStockpile(battle: Battle): void {
  const stored = new Map<Unit, number>();

  const charges = (unit: Unit): number => stored.get(unit) ?? 0;

  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    const held = charges(event.source);

    // Once a step, so one cast fills the store
    if (event.move === Moves.Stockpile) {
      if (held >= MAX_CHARGES) {
        event.source.triggerMoveEffectFailed(event.move, event.target, event.steps);
        return;
      }
      stored.set(event.source, held + 1);
      return;
    }

    if (event.move !== Moves.Swallow) {
      return;
    }
    if (held === 0) {
      event.source.triggerMoveEffectFailed(event.move, event.target, event.steps);
      return;
    }

    stored.delete(event.source);
    event.source.heal(
      { type: EffectType.Move, move: event.move, unit: event.source },
      event.source,
      event.source.checkStat(Stats.HP, 0) * (SWALLOW_SHARES[held - 1] ?? 1),
      0,
    );
  });

  // Spit Up carries no power of its own: what came up is what was put
  // away, and the store is empty either way afterwards
  battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Exact, (event) => {
    if (event.move === Moves.SpitUp) {
      event.power = charges(event.source) * POWER_PER_CHARGE;
    }
  });

  battle.on(BattleEvents.UnitTriggerMove, AttackPriority.Post, (event) => {
    if (event.move === Moves.SpitUp) {
      stored.delete(event.source);
    }
  });

  // Nothing stored is nothing to spend, and a full store is nowhere
  // left to put one
  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (!event.usable) {
      return;
    }
    if (event.move === Moves.SpitUp || event.move === Moves.Swallow) {
      event.usable = charges(event.source) > 0;
    }
    if (event.move === Moves.Stockpile) {
      event.usable = charges(event.source) < MAX_CHARGES;
    }
  });

  /**
   * The steps are what the move is rather than a wind-up before it, so
   * the generic per-step penalty is handed back the way a rampage's
   * is: a pokemon banking three charges is doing something on every
   * one of them
   */
  battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    if (event.move === Moves.Stockpile) {
      event.score += STEP_PENALTY * event.source.checkMoveSteps(event.move, event.target);
      return;
    }

    // A Swallow at full health puts nothing back
    if (
      event.move === Moves.Swallow &&
      event.source.health >= event.source.checkStat(Stats.HP, 0)
    ) {
      event.score -= USELESS_PENALTY;
    }
  });

  for (const gone of [BattleEvents.UnitFaints, BattleEvents.UnitLeavesField] as const) {
    battle.on(gone, EventPriority.Post, (event) => {
      stored.delete(event.source);
    });
  }
}
