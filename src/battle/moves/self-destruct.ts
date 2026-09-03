import { AttackPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import { DamageFlags, Moves } from '../../data/ids/moves';
import { getMoveData } from '../../data/moves';
import { RISKY_PENALTY, USELESS_PENALTY } from '../ai/score';
import type Battle from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';

/**
 * Moves whose blast engulfs the user as one of its own targets (Damp
 * forbids casting them)
 */
export const SELF_DESTRUCT_MOVES = new Set<Moves>([Moves.SelfDestruct, Moves.Explosion]);

/** The share of its health below which a unit has little left to lose */
const LAST_LEGS = 0.5;

// https://bulbapedia.bulbagarden.net/wiki/Explosion_(move)
export default function setupSelfDestructMoves(battle: Battle): void {
  /**
   * The user is just one more target of its own blast, but the
   * self-hit bypasses the immunity and accuracy checks entirely: the
   * standard chain is replaced by indirect damage of the move's raw
   * power, so no damage modification applies.
   */
  battle.on(BattleEvents.UnitTriggerMoveTarget, AttackPriority.Pre, (event) => {
    if (
      SELF_DESTRUCT_MOVES.has(event.move) &&
      event.target.type === MoveTargetType.Unit &&
      event.target.unit === event.source
    ) {
      event.disabled = true;

      event.source.damage(
        { type: EffectType.Move, move: event.move, unit: event.source },
        event.source,
        getMoveData(event.move).power ?? 0,
        // The blast costs its raw power in health, paid whatever the
        // payer is: it is what kills an ordinary pokemon outright and
        // what a raid pool barely feels
        DamageFlags.Indirect | DamageFlags.Cost,
      );
    }
  });

  /**
   * The user's life is the price, and a unit that still has one to
   * spend has better things to do with it. Down to its last, the
   * trade is worth making
   */
  battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    if (!SELF_DESTRUCT_MOVES.has(event.move)) {
      return;
    }

    const source = event.source;
    const ratio = source.health / Math.max(1, source.checkStat(Stats.HP, 0));

    event.score -= ratio > LAST_LEGS ? USELESS_PENALTY : RISKY_PENALTY;
  });
}
