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
}
