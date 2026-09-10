import { AttackPriority } from '../../core/event-emitter';
import { Stages } from '../../data/constants/stats';
import { Moves } from '../../data/ids/moves';
import { Genders } from '../../data/ids/species';
import type Battle from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';
import type Unit from '../unit';

/**
 * Captivate: two stages of Special Attack out of anything that can be
 * charmed, which is the opposite gender and nothing else. It is
 * Attract's gender rule with a stat drop instead of a status, so the
 * check is written here rather than through status immunity
 * https://bulbapedia.bulbagarden.net/wiki/Captivate_(move)
 */
const DROP = -2;

function charms(source: Unit, target: Unit): boolean {
  return (
    source.gender !== Genders.Genderless &&
    target.gender !== Genders.Genderless &&
    source.gender !== target.gender
  );
}

export default function setupCaptivate(battle: Battle): void {
  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    if (event.move !== Moves.Captivate || event.target.type !== MoveTargetType.Unit) {
      return;
    }

    const target = event.target.unit;

    if (!charms(event.source, target)) {
      event.source.triggerMoveEffectFailed(event.move, event.target, event.steps);
      return;
    }

    target.addStage(Stages.SpecialAttack, DROP, {
      type: EffectType.Move,
      unit: event.source,
      move: event.move,
    });
  });

  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (
      event.usable &&
      event.move === Moves.Captivate &&
      event.target.type === MoveTargetType.Unit
    ) {
      event.usable = charms(event.source, event.target.unit);
    }
  });
}
