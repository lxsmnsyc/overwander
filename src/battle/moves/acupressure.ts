import { AttackPriority } from '../../core/event-emitter';
import { Stages } from '../../data/constants/stats';
import { Moves } from '../../data/ids/moves';
import type Battle from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';

/**
 * Acupressure: two stages on one stat, and which stat is not the
 * caster's to choose. Cast on itself or on a teammate, so a support
 * pokemon can press somebody else's advantage rather than its own
 * https://bulbapedia.bulbagarden.net/wiki/Acupressure_(move)
 */
const PRESSED = 2;

/** The stats a press can find, which is every one a stage sits on */
const POINTS: Stages[] = [
  Stages.Attack,
  Stages.Defense,
  Stages.SpecialAttack,
  Stages.SpecialDefense,
  Stages.Speed,
  Stages.Accuracy,
  Stages.Evasion,
];

export default function setupAcupressure(battle: Battle): void {
  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    if (event.move !== Moves.Acupressure) {
      return;
    }

    const pressed = event.target.type === MoveTargetType.Unit ? event.target.unit : event.source;

    pressed.addStage(POINTS[Math.floor(battle.random() * POINTS.length)], PRESSED, {
      type: EffectType.Move,
      unit: event.source,
      move: event.move,
    });
  });
}
