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
}
