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
  // Wishiwashi
  registerAbility(Abilities.Schooling, {
    name: 'Schooling',
    description:
      'From level 20 it fights as a school while above 1/4 HP, with far higher stats, and alone below it.',
  });
  // Dewpider
  registerAbility(Abilities.WaterBubble, {
    name: 'Water Bubble',
    description: 'Fire moves hit it at 0.5x, it cannot be burned, and its Water moves hit 2x.',
  });
  // Wimpod
  registerAbility(Abilities.WimpOut, {
    name: 'Wimp Out',
    description:
      'When damage drops it below 1/2 HP, it leaves the field and its strongest teammate comes in.',
  });
}
