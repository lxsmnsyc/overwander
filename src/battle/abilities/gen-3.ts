import { EventPriority } from '../../core/event-emitter';
import { Stages } from '../../data/constants/stats';
import Abilities from '../../data/ids/abilities';
import { MoveFlags } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, EffectType } from '../events';
import { createAbility, createAbsorbStageAbility, movesFlagged } from './__create';

/**
 * The mainline's Wind Rider also rises when a Tailwind starts behind
 * it. Nothing here blows one, so this is the half that has something
 * to answer: the wind aimed at it
 * https://bulbapedia.bulbagarden.net/wiki/Wind_Rider_(Ability)
 */
/**
 * Truant loafs on alternate turns in the mainline, and there are no
 * turns here to alternate between. So it loafs by the clock instead:
 * the move lock Hyper Beam leaves behind, laid on every move it
 * finishes rather than on one of them
 * https://bulbapedia.bulbagarden.net/wiki/Truant_(Ability)
 */
const setupAbilities = [
  createAbsorbStageAbility(Abilities.WindRider, Stages.Attack, movesFlagged(MoveFlags.Wind)),

  createAbility(Abilities.Truant, (battle) =>
    battle.on(BattleEvents.UnitFinishCast, EventPriority.Post, (event) => {
      if (event.source.hasAbility(Abilities.Truant)) {
        event.source.addStatus(Statuses.Recharging, {
          type: EffectType.Ability,
          ability: Abilities.Truant,
          unit: event.source,
        });
      }
    }),
  ),
];

export default function setupGen3Abilities(battle: Battle): void {
  for (const setup of setupAbilities) {
    setup(battle);
  }
}
