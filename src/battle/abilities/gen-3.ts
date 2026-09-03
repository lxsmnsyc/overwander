import { Stages } from '../../data/constants/stats';
import Abilities from '../../data/ids/abilities';
import { MoveFlags } from '../../data/ids/moves';
import type Battle from '../core';
import { createAbsorbStageAbility, movesFlagged } from './__create';

/**
 * The mainline's Wind Rider also rises when a Tailwind starts behind
 * it. Nothing here blows one, so this is the half that has something
 * to answer: the wind aimed at it
 * https://bulbapedia.bulbagarden.net/wiki/Wind_Rider_(Ability)
 */
const setupAbilities = [
  createAbsorbStageAbility(Abilities.WindRider, Stages.Attack, movesFlagged(MoveFlags.Wind)),
];

export default function setupGen3Abilities(battle: Battle): void {
  for (const setup of setupAbilities) {
    setup(battle);
  }
}
