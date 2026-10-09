import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import { DamageFlags } from '../../data/ids/moves';
import { RECOIL_MOVES } from '../../data/moves/recoil';
import { RISKY_PENALTY, USELESS_PENALTY } from '../ai/score';
import type Battle from '../core';
import {
  BattleEvents,
  type CheckUnitRecoilEvent,
  EffectType,
  MoveTargetType,
  type UnitDamageEvent,
} from '../events';

export { RECOIL_MOVES } from '../../data/moves/recoil';

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
        const before = event.source.health;

        event.source.damage(
          {
            type: EffectType.None,
          },
          event.source,
          amount,
          DamageFlags.Indirect,
        );
        // Health actually lost, which is what a recoil feat counts
        if (!battle.estimating) {
          event.source.recoil += Math.max(0, before - event.source.health);
        }
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
    const hit: UnitDamageEvent = {
      id: 'UnitDamage',
      disabled: false,
      source,
      target: event.target.type === MoveTargetType.Unit ? event.target.unit : source,
      value: 1,
      flags: 0,
      cause: { type: EffectType.Move, move: event.move, unit: source },
      success: true,
    };

    // Asked the way the hit asks: Rock Head refuses the recoil, and
    // Magic Guard the damage it would do
    if (
      !checkRecoil(hit) ||
      !source.checkCanDamage({ type: EffectType.None }, source, 1, DamageFlags.Indirect)
    ) {
      return;
    }

    const ratio = source.health / Math.max(1, source.checkStat(Stats.HP, 0));

    event.score -= ratio < TOO_THIN ? USELESS_PENALTY : RISKY_PENALTY;
  });
}
