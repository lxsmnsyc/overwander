import Abilities from '../ids/abilities';
import { registerAbility } from './__create';

/**
 * What Sinnoh brought, described in this engine's terms rather than
 * the mainline's
 */
export default function registerGen4Abilities(): void {
  // Drifloon
  registerAbility(Abilities.FlareBoost, {
    name: 'Flare Boost',
    description: 'Special Attack is 1.5x while it is burned.',
  });
  // Buneary
  registerAbility(Abilities.Klutz, {
    name: 'Klutz',
    description: 'Whatever it is holding does nothing at all.',
  });
  // Drapion
  registerAbility(Abilities.Merciless, {
    name: 'Merciless',
    description: 'Its moves land critically on a poisoned target, armour permitting.',
  });
  // Bronzor
  registerAbility(Abilities.Heatproof, {
    name: 'Heatproof',
    description: 'Fire moves hit it at 0.5x, and a burn takes half as much off it.',
  });
}
