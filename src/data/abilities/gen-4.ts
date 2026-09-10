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
  // Togepi
  registerAbility(Abilities.FriendGuard, {
    name: 'Friend Guard',
    description: 'Its teammates take 0.75x from everything while it stands.',
  });
  // Regigigas
  registerAbility(Abilities.SlowStart, {
    name: 'Slow Start',
    description: 'Attack and Speed are halved for its first 8 seconds on the field.',
  });
  // Pachirisu
  registerAbility(Abilities.CheekPouch, {
    name: 'Cheek Pouch',
    description: 'Eating a berry also puts 1/3 of its HP back, whatever the berry was for.',
  });
  // Cresselia
  registerAbility(Abilities.AromaVeil, {
    name: 'Aroma Veil',
    description: 'Its teammates cannot be taunted, tormented, encored, charmed or heal blocked.',
  });
  // Bronzor
  registerAbility(Abilities.Heatproof, {
    name: 'Heatproof',
    description: 'Fire moves hit it at 0.5x, and a burn takes half as much off it.',
  });
}
