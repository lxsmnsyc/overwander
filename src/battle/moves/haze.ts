import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Stages } from '../../data/constants/stats';
import { Moves } from '../../data/ids/moves';
import { USELESS_PENALTY } from '../ai/score';
import type Battle from '../core';
import { BattleEvents, EffectType } from '../events';
import type Unit from '../unit';

const STAGES = [
  Stages.Attack,
  Stages.Defense,
  Stages.SpecialAttack,
  Stages.SpecialDefense,
  Stages.Speed,
  Stages.Evasion,
  Stages.Accuracy,
];

/**
 * How far ahead a unit's stages have put it, counted as one number so
 * a clearing move can weigh a whole side at once
 */
function totalStages(unit: Unit): number {
  let total = 0;

  for (const stage of STAGES) {
    total += unit.stages[stage];
  }
  return total;
}

// https://bulbapedia.bulbagarden.net/wiki/Haze_(move)
export default function setupHaze(battle: Battle): void {
  battle.on(BattleEvents.UnitTriggerMoveEffect, EventPriority.Exact, (event) => {
    if (event.move !== Moves.Haze) {
      return;
    }

    const cause = {
      type: EffectType.Move,
      move: event.move,
      unit: event.source,
    } as const;

    // Every unit's stat stages reset, the user's included
    for (const unit of battle.units()) {
      if (unit.alive) {
        unit.resetStages(cause);
      }
    }
  });

  /**
   * Haze clears the user's own side along with everybody else's, so it
   * is only worth a cast when the field is against the user. A unit
   * that has just spent three casts setting up would otherwise wipe
   * its own work off for free
   */
  battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    if (event.move !== Moves.Haze) {
      return;
    }

    const alliance = event.source.team.alliance;
    let net = 0;

    for (const unit of battle.units()) {
      if (unit.alive) {
        net += unit.team.alliance === alliance ? totalStages(unit) : -totalStages(unit);
      }
    }

    // Level or ahead: there is nothing here worth clearing
    if (net >= 0) {
      event.score -= USELESS_PENALTY;
    }
  });
}
