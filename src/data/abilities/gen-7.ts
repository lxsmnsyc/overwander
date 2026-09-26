import Abilities from '../ids/abilities';
import { registerAbility } from './__create';

/**
 * What Alola brought, described in this engine's terms rather than
 * the mainline's
 */
export default function registerGen7Abilities(): void {
  // Rowlet
  registerAbility(Abilities.LongReach, {
    name: 'Long Reach',
    description: 'None of its moves make contact, so nothing that answers a touch answers it.',
  });
  // Popplio
  registerAbility(Abilities.LiquidVoice, {
    name: 'Liquid Voice',
    description: 'Its sound moves are Water moves instead.',
  });
  // Yungoos
  registerAbility(Abilities.Stakeout, {
    name: 'Stakeout',
    description:
      'Its moves hit 2x against an enemy that has not acted since it came onto the field.',
  });
}
