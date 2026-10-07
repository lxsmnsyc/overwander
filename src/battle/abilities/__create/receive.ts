import { EventPriority } from '../../../core/event-emitter';
import Abilities from '../../../data/ids/abilities';
import type Battle from '../../core';
import { BattleEvents } from '../../events';
import { abilitiesOf } from '../../moves/ability-moves';
import { createAbility } from './create';

/**
 * What Receiver and Power of Alchemy will not take up: the ones that
 * copy in their own right, and the ones only a particular shape can use
 */
const UNRECEIVABLE = new Set<Abilities>([
  Abilities.Receiver,
  Abilities.PowerOfAlchemy,
  Abilities.Trace,
  Abilities.Forecast,
  Abilities.FlowerGift,
  Abilities.Multitype,
  Abilities.Illusion,
  Abilities.WonderGuard,
  Abilities.ZenMode,
  Abilities.Imposter,
  Abilities.StanceChange,
  Abilities.PowerConstruct,
  Abilities.Schooling,
  Abilities.ShieldsDown,
  Abilities.Comatose,
  Abilities.Disguise,
  Abilities.RksSystem,
]);

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
