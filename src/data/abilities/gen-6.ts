import Abilities from '../ids/abilities';
import { registerAbility } from './__create';

/**
 * What Kalos brought, described in this engine's terms rather than
 * the mainline's
 */
export default function registerGen6Abilities(): void {
  // Chespin
  registerAbility(Abilities.Bulletproof, {
    name: 'Bulletproof',
    description: 'Balls, bombs and anything else thrown at it from a distance do nothing.',
  });
  // Fennekin
  registerAbility(Abilities.Magician, {
    name: 'Magician',
    description: 'Takes the held item of whatever it lands a move on, if its own hands are empty.',
  });
}
