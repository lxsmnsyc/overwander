import Abilities from '../ids/abilities';
import { registerAbility } from './__create';

/**
 * What Unova brought, described in this engine's terms rather than
 * the mainline's
 */
export default function registerGen5Abilities(): void {
  // Darmanitan
  registerAbility(Abilities.ZenMode, {
    name: 'Zen Mode',
    description: 'Below 1/2 HP it sits down into its Zen shape, and it stands back up above that.',
  });
}
