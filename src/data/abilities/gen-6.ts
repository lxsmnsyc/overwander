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
  // Flabebe
  registerAbility(Abilities.FlowerVeil, {
    name: 'Flower Veil',
    description:
      'Grass-type teammates, itself included, cannot be given a status or have a stat lowered by anybody else.',
  });
  registerAbility(Abilities.Symbiosis, {
    name: 'Symbiosis',
    description: 'Hands its own held item to a teammate the moment they use theirs up.',
  });
  // Skiddo
  registerAbility(Abilities.GrassPelt, {
    name: 'Grass Pelt',
    description: 'Its Defense counts 1.5x while it stands on Grassy Terrain.',
  });
  // Florges, which the mainline leaves two abilities short
  registerAbility(Abilities.MistySurge, {
    name: 'Misty Surge',
    description: 'Lays Misty Terrain as it takes the field.',
  });
  // Honedge
  registerAbility(Abilities.StanceChange, {
    name: 'Stance Change',
    description: "It draws the blade to attack and sheathes it again on King's Shield.",
  });
}
