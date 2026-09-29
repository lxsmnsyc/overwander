import { EventPriority } from '../../../core/event-emitter';
import type Abilities from '../../../data/ids/abilities';
import type { Moves } from '../../../data/ids/moves';
import type Battle from '../../core';
import { BattleEvents, MoveTargetType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import { createAbility } from './create';

/**
 * Meta ability for the four Surges. The terrain is cast as its move
 * rather than laid by hand, so the move's own clock runs it
 * https://bulbapedia.bulbagarden.net/wiki/Electric_Surge_(Ability)
 */
export default function createSurgeAbility(
  ability: Abilities,
  move: Moves,
): (battle: Battle) => void {
  return createAbility(
    ability,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
          if (event.source.hasAbility(ability)) {
            event.source.triggerAbility(ability);
          }
        }),
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability === ability) {
            event.source.triggerMove(move, { type: MoveTargetType.None }, 0);
          }
        }),
      ]),
  );
}
