import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import { DamageFlags, Moves } from '../../data/ids/moves';
import { RISKY_PENALTY, USELESS_PENALTY } from '../ai/score';
import type Battle from '../core';
import {
  BattleEvents,
  type CheckUnitRecoilEvent,
  EffectType,
  type UnitDamageEvent,
} from '../events';

export const RECOIL_MOVES: { [key in Moves]?: number } = {
  [Moves.TakeDown]: 1 / 4,
  [Moves.DoubleEdge]: 1 / 3,
  [Moves.Submission]: 1 / 4,
};

/**
 * The share of its health below which a unit cannot afford to be hurt
 * by its own move
 */
const TOO_THIN = 0.25;

export default function setupRecoilMoves(battle: Battle): void {
  function checkRecoil(parent: UnitDamageEvent): boolean {
    const event: CheckUnitRecoilEvent = {
      id: '',
      disabled: false,
      parent,
      recoil: false,
    };
    battle.emit(BattleEvents.CheckUnitRecoil, event);
    return event.recoil;
  }
  battle.on(BattleEvents.CheckUnitRecoil, EventPriority.Exact, (event) => {
    event.recoil = !event.recoil && event.parent.target.alive;
  });

  battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
    if (checkRecoil(event) && event.cause.type === EffectType.Move) {
      const recoilFactor = RECOIL_MOVES[event.cause.move];

      if (recoilFactor != null) {
        const amount = event.value * recoilFactor;

        event.source.damage(
          {
            type: EffectType.None,
          },
          event.source,
          amount,
          DamageFlags.Indirect,
        );
      }
    }
  });

  /**
   * Recoil comes off whatever the move deals, which is a number this
   * cannot know yet. What it can know is whether the user has the
   * health to absorb any of it
   */
  battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    if (RECOIL_MOVES[event.move] == null) {
      return;
    }

    const source = event.source;
    const ratio = source.health / Math.max(1, source.checkStat(Stats.HP, 0));

    event.score -= ratio < TOO_THIN ? USELESS_PENALTY : RISKY_PENALTY;
  });
}
