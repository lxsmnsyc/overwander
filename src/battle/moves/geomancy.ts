import { AttackPriority } from '../../core/event-emitter';
import { Stages } from '../../data/constants/stats';
import { Moves } from '../../data/ids/moves';
import type Battle from '../core';
import { BattleEvents, EffectType } from '../events';

/**
 * Geomancy: a wind-up drawing the ground's power in, then three stats
 * two stages each once it lands. A Power Herb skips the wind-up the way
 * it skips any cast
 * https://bulbapedia.bulbagarden.net/wiki/Geomancy_(move)
 */
export const GEOMANCY_STAGES = [Stages.SpecialAttack, Stages.SpecialDefense, Stages.Speed];
export const GEOMANCY_VALUE = 2;

export default function setupGeomancy(battle: Battle): void {
  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    // The first step only gathers: the rise is the landing's
    if (event.move !== Moves.Geomancy || event.steps !== 0) {
      return;
    }

    const cause = { type: EffectType.Move, move: event.move, unit: event.source } as const;

    for (const stage of GEOMANCY_STAGES) {
      event.source.addStage(stage, GEOMANCY_VALUE, cause);
    }
  });
}
