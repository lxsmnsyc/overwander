import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import { Moves } from '../../data/ids/moves';
import { scoreHeal } from '../ai/score';
import type Battle from '../core';
import { BattleEvents, EffectType, type MoveTarget, MoveTargetType } from '../events';
import type Unit from '../unit';

/**
 * Pollen Puff bursts on an enemy and feeds a friend: aimed at the
 * user's own side it deals nothing and heals 1/2 of the target's HP
 * https://bulbapedia.bulbagarden.net/wiki/Pollen_Puff_(move)
 */
export const POLLEN_PUFF_HEAL = 0.5;

function fedFriend(source: Unit, move: Moves, target: MoveTarget): Unit | null {
  return move === Moves.PollenPuff &&
    target.type === MoveTargetType.Unit &&
    target.unit !== source &&
    target.unit.team.alliance === source.team.alliance
    ? target.unit
    : null;
}

export default function setupPollenPuff(battle: Battle): void {
  // No power at a friend, so nothing strikes it
  battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
    if (fedFriend(event.source, event.move, event.target) != null) {
      event.power = undefined;
    }
  });

  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    const friend = fedFriend(event.source, event.move, event.target);

    if (friend != null) {
      event.source.heal(
        { type: EffectType.Move, move: event.move, unit: event.source },
        friend,
        friend.checkStat(Stats.HP, 0) * POLLEN_PUFF_HEAL,
        0,
      );
    }
  });

  battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    const friend = fedFriend(event.source, event.move, event.target);

    if (friend != null) {
      scoreHeal(event, friend, POLLEN_PUFF_HEAL);
    }
  });
}
