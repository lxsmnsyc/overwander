import { EventPriority } from '../../../core/event-emitter';
import type Abilities from '../../../data/ids/abilities';
import { UNRECEIVABLE } from '../../../data/abilities/flags';
import type Battle from '../../battle';
import { BattleEvents } from '../../events';
import { abilitiesOf } from '../../moves/ability-moves';
import { createAbility } from './create';

/**
 * Meta ability for the ones that take up a fallen teammate's ability
 * (Receiver, Power of Alchemy): the first one it does not already carry
 * replaces this one, so there is nothing left to take another
 * https://bulbapedia.bulbagarden.net/wiki/Receiver_(Ability)
 */
export default function createReceiverAbility(ability: Abilities): (battle: Battle) => void {
  return createAbility(ability, (battle) =>
    battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
      const fallen = event.source;

      for (const holder of fallen.team.units) {
        if (holder === fallen || !holder.alive || !holder.hasAbility(ability)) {
          continue;
        }

        for (const taken of abilitiesOf(fallen)) {
          if (!UNRECEIVABLE.has(taken) && !holder.hasAbility(taken)) {
            holder.triggerAbility(ability);
            holder.removeAbility(ability);
            holder.addAbility(taken);
            return;
          }
        }
      }
    }),
  );
}
