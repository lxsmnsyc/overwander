import Abilities from '../ids/abilities';
import { registerAbility } from './__create';

/**
 * What Unova brought, described in this engine's terms rather than
 * the mainline's
 */
export default function registerGen5Abilities(): void {
  // Yamask
  registerAbility(Abilities.Mummy, {
    name: 'Mummy',
    description:
      'Whoever lands a contact move on it loses one of their abilities and catches this one.',
  });
  // Cofagrigus
  registerAbility(Abilities.PerishBody, {
    name: 'Perish Body',
    description:
      'Whoever lands a contact move on it faints in 3 turns, and so does it. Once per battle.',
  });
  // Darmanitan
  registerAbility(Abilities.ZenMode, {
    name: 'Zen Mode',
    description: 'Below 1/2 HP it sits down into its Zen shape, and it stands back up above that.',
  });
}
