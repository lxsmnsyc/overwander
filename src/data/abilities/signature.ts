import Abilities from '../ids/abilities';
import { registerAbility } from './__create';

/**
 * One invented ability per evolution family, themed on what the line
 * is and how it fights. None of them are rolled at birth or bred for:
 * they are granted, so a species' ordinary pool is untouched
 */
export default function registerSignatureAbilities(): void {
  // Bulbasaur
  registerAbility(Abilities.SeedCache, {
    name: 'Seed Cache',
    description:
      'Banks 1/4 of every hit it takes, up to 1/2 of its HP. The next Grass move it lands spends the bank as extra damage.',
  });

  // Charmander
  registerAbility(Abilities.Afterburn, {
    name: 'Afterburn',
    description:
      'Each Fire move it lands cuts 15% off its cast and channel times, up to 45%. A miss or a move of another type puts it back to 0.',
  });

  // Squirtle
  registerAbility(Abilities.Overpressure, {
    name: 'Overpressure',
    description:
      'Water moves hit 1.3x, but each one it lands adds 20% to its own cooldowns, up to 60%. A move of another type clears the fouling.',
  });
}
