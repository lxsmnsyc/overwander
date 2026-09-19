import { EventPriority } from '../../core/event-emitter';
import { TYPE_EFFECTIVENESS, TYPE_EFFECTIVENESS_FACTOR, Types } from '../../data/constants/types';
import { Moves } from '../../data/ids/moves';
import type Battle from '../core';
import { BattleEvents } from '../events';

/**
 * The three moves that read the type chart their own way. Flying
 * Press is a Fighting move that also lands as a Flying one, Freeze-Dry
 * is an Ice move that Water does not resist, and Thousand Arrows is a
 * Ground move that a Flying type does not shrug off
 * https://bulbapedia.bulbagarden.net/wiki/Flying_Press_(move)
 */

/** What an attacking type is worth against one defending type */
function factor(attacking: Types, defending: Types): number {
  const result = TYPE_EFFECTIVENESS[attacking][defending];

  // Explicit null check: TypeEffectiveness.Effective is 0
  return result == null ? 1 : TYPE_EFFECTIVENESS_FACTOR[result];
}

/** What Freeze-Dry is worth against Water, whatever the chart says */
export const FREEZE_DRY_AGAINST_WATER = 2;

export default function setupTypeMatchups(battle: Battle): void {
  battle.on(BattleEvents.UnitAttackResolveEffectiveness, EventPriority.Post, (event) => {
    const move = event.parent.move;
    const defending = event.defendingType;

    if (move === Moves.FlyingPress) {
      event.multiplier *= factor(Types.Flying, defending);
    } else if (move === Moves.FreezeDry && defending === Types.Water) {
      event.multiplier *= FREEZE_DRY_AGAINST_WATER / factor(Types.Ice, Types.Water);
    } else if (move === Moves.ThousandArrows && defending === Types.Flying) {
      event.multiplier = 1;
    }
  });
}
