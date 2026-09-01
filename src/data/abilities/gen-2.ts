import Abilities from '../ids/abilities';
import { registerAbility } from './__create';

/**
 * Abilities the Gen 2 species brought that no Gen 1 species carries.
 * The grouping is by the line that introduces it, as in gen-1.ts.
 */
export default function registerGen2Abilities(): void {
  // Cyndaquil
  registerAbility(Abilities.Berserk, {
    name: 'Berserk',
    description: '+1 Special Attack whenever a hit takes it under half its HP.',
  });
  // Natu
  registerAbility(Abilities.MagicBounce, {
    name: 'Magic Bounce',
    description: 'A status move aimed at it is cast back at whoever used it.',
  });
  // Mareep
  registerAbility(Abilities.Plus, {
    name: 'Plus',
    description: '1.5x Special Attack while a living ally also has Plus.',
  });
  registerAbility(Abilities.MotorDrive, {
    name: 'Motor Drive',
    description: 'Electric moves cannot touch it, and raise its Speed a stage instead.',
  });
}
