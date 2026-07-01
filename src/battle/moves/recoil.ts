import { EventPriority } from '../../core/event-emitter';
import { DamageFlags, Moves } from '../../data/ids/moves';
import type { Battle } from '../core';
import {
  BattleEvents,
  type CheckUnitRecoilEvent,
  EffectType,
  type UnitDamageEvent,
} from '../events';

const RECOIL_MOVES: { [key in Moves]?: number } = {
  [Moves.TakeDown]: 0.25,
};

export function setupRecoilMoves(battle: Battle) {
  function checkRecoil(parent: UnitDamageEvent) {
    const event: CheckUnitRecoilEvent = {
      id: '',
      disabled: false,
      parent,
      recoil: false,
    };
    battle.emit(BattleEvents.CheckUnitRecoil, event);
    return event.recoil;
  }
  battle.on(BattleEvents.CheckUnitRecoil, EventPriority.Exact, event => {
    event.recoil = !event.recoil && event.parent.target.alive;
  });

  battle.on(BattleEvents.UnitDamage, EventPriority.Post, event => {
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
}
