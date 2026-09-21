import { EventPriority } from '../../../core/event-emitter';
import Abilities from '../../../data/ids/abilities';
import { Moves } from '../../../data/ids/moves';
import { BattleEvents } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import { unitTarget } from '../../utils';
import { createAbility } from '../__create';
import { createSpentItemAbility, firstEnemy } from './__create';

/**
 * The two Kalos lines that waited on their evolutions being drawn:
 * the cub that announces itself, and the perfume that answers
 * Swirlix's sugar from the other side of the field
 */
const setupAbilities = [
  // Litleo: the roar is the opening move, so Noble Roar's own numbers
  // decide what it takes off whoever it is aimed at
  createAbility(
    Abilities.PrideCall,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
          if (!event.reactivation && event.source.hasAbility(Abilities.PrideCall)) {
            event.source.triggerAbility(Abilities.PrideCall);
          }
        }),
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability !== Abilities.PrideCall) {
            return;
          }

          const enemy = firstEnemy(battle, event.source);

          if (enemy) {
            event.source.triggerMove(Moves.NobleRoar, unitTarget(enemy), 0);
          }
        }),
      ]),
  ),

  // Spritzee: the same spent item, read from the other side
  createSpentItemAbility(Abilities.CalmingScent, false),
];

export default setupAbilities;
