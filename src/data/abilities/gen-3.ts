import Abilities from '../ids/abilities';
import { registerAbility } from './__create';

/**
 * What Hoenn brought, described in this engine's terms rather than
 * the mainline's
 */
export default function registerGen3Abilities(): void {
  // Shiftry
  registerAbility(Abilities.WindRider, {
    name: 'Wind Rider',
    description: 'Takes nothing from a move that rides on the wind, and gains 1 Attack stage.',
  });
  // Slakoth
  registerAbility(Abilities.Truant, {
    name: 'Truant',
    description: 'Loafs about for 2 seconds after every move it finishes.',
  });
  // Shedinja
  registerAbility(Abilities.WonderGuard, {
    name: 'Wonder Guard',
    description:
      'Only a move it is weak to lands at all. Status moves, poison and the weather still reach it.',
  });
  // Shroomish
  registerAbility(Abilities.PoisonHeal, {
    name: 'Poison Heal',
    description: 'Poison restores 1/8 of its HP each time it would take some.',
  });
}
