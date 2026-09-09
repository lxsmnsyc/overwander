import { AttackPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import { DamageFlags, Moves } from '../../data/ids/moves';
import { RISKY_PENALTY, USELESS_PENALTY } from '../ai/score';
import type Battle from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';
import { MAJOR_STATUS_CONDITIONS } from '../status';
import type Unit from '../unit';

/**
 * The two sacrifices: the user goes down and a teammate standing
 * beside it is made whole.
 *
 * The mainline spends them on whoever is sent in afterwards, and
 * nothing is sent in here: a team is on the field from the start of
 * the fight. So the gift goes to somebody already out there, which is
 * also what makes them worth casting at all.
 *
 * Lunar Dance restores PP on top of the healing, and PP is not a pool
 * here: it is how long a move waits. So the dance clears what its
 * target is waiting on, which leaves it with everything ready at once.
 * The wait itself is untouched, so Speed still says how often a move
 * comes round afterwards
 * https://bulbapedia.bulbagarden.net/wiki/Healing_Wish_(move)
 */
const SACRIFICES = new Set<Moves>([Moves.HealingWish, Moves.LunarDance]);

/** The share of its health above which the trade is not worth making */
const LAST_LEGS = 0.5;

/** Whether the target has anything to gain from the sacrifice */
function needs(unit: Unit): boolean {
  if (unit.health < unit.checkStat(Stats.HP, 0)) {
    return true;
  }
  for (const status of MAJOR_STATUS_CONDITIONS) {
    if (unit.status[status] != null) {
      return true;
    }
  }
  return false;
}

export default function setupHealingWish(battle: Battle): void {
  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Post, (event) => {
    if (!SACRIFICES.has(event.move) || event.target.type !== MoveTargetType.Unit) {
      return;
    }

    const cause = { type: EffectType.Move, move: event.move, unit: event.source } as const;
    const target = event.target.unit;

    event.source.heal(cause, target, target.checkStat(Stats.HP, 0), 0);

    for (const status of MAJOR_STATUS_CONDITIONS) {
      target.removeStatus(status, cause);
    }

    if (event.move === Moves.LunarDance) {
      for (const key in target.moves) {
        // tsc requires the assertion to index the Moves-mapped record;
        // tsgolint resolves the const enum to number and disagrees
        // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
        target.finishCooldown(Number(key) as Moves);
      }
    }

    event.source.damage(
      cause,
      event.source,
      event.source.health,
      DamageFlags.Indirect | DamageFlags.Cost,
    );
  });

  // A pokemon is worth spending once it has little left to spend, and
  // never on a teammate that has nothing to gain
  battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    if (!SACRIFICES.has(event.move) || event.target.type !== MoveTargetType.Unit) {
      return;
    }

    if (!needs(event.target.unit)) {
      event.score -= USELESS_PENALTY;
      return;
    }

    const ratio = event.source.health / Math.max(1, event.source.checkStat(Stats.HP, 0));

    event.score -= ratio > LAST_LEGS ? USELESS_PENALTY : RISKY_PENALTY;
  });
}
