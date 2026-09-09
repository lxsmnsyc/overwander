import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import { DamageFlags, Moves } from '../../data/ids/moves';
import { RISKY_PENALTY, USELESS_PENALTY } from '../ai/score';
import type Battle from '../core';
import { BattleEvents, EffectType } from '../events';
import { MAJOR_STATUS_CONDITIONS } from '../status';
import type Team from '../team';

/**
 * Healing Wish: the user goes down, and whoever takes its place comes
 * in whole.
 *
 * The wish is left with the side rather than with the unit, since the
 * unit that made it is gone by the time it is answered, and it waits
 * there until somebody arrives: a side with nobody left to send in
 * has simply spent a pokemon
 * https://bulbapedia.bulbagarden.net/wiki/Healing_Wish_(move)
 */

/** The share of its health above which the trade is not worth making */
const LAST_LEGS = 0.5;

export default function setupHealingWish(battle: Battle): void {
  /** The sides holding a wish nobody has arrived to take yet */
  const wished = new Set<Team>();

  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Post, (event) => {
    if (event.move !== Moves.HealingWish) {
      return;
    }

    wished.add(event.source.team);

    event.source.damage(
      { type: EffectType.Move, move: event.move, unit: event.source },
      event.source,
      event.source.health,
      DamageFlags.Indirect | DamageFlags.Cost,
    );
  });

  battle.on(BattleEvents.UnitFinishSwitch, EventPriority.Post, (event) => {
    const unit = event.source;

    if (!wished.has(unit.team) || !unit.alive) {
      return;
    }

    wished.delete(unit.team);

    const cause = { type: EffectType.Move, move: Moves.HealingWish, unit } as const;

    unit.heal(cause, unit, unit.checkStat(Stats.HP, 0), 0);
    for (const status of MAJOR_STATUS_CONDITIONS) {
      unit.removeStatus(status, cause);
    }
  });

  // A pokemon is worth spending on the wish once it has little left
  // to spend, and never while it is still whole
  battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    if (event.move !== Moves.HealingWish) {
      return;
    }

    const ratio = event.source.health / Math.max(1, event.source.checkStat(Stats.HP, 0));

    event.score -= ratio > LAST_LEGS ? USELESS_PENALTY : RISKY_PENALTY;
  });
}
