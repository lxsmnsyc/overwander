import { ItemFlags, ItemTypes, Items } from '../ids/items';
import { registerItem } from './__create';

/**
 * Poke Ball variants. A ball is spent by the throw itself, so they
 * are consumable and usable, never held — the catch multipliers
 * live with the safari session (BALL_MODIFIERS), not here.
 */
export default function registerBalls(): void {
  // The plain ball, no modifier
  registerItem(Items.PokeBall, {
    name: 'Poke Ball',
    type: ItemTypes.PokeBall,
    flags: ItemFlags.Usable | ItemFlags.Consumable,
  });
  registerItem(Items.GreatBall, {
    name: 'Great Ball',
    type: ItemTypes.PokeBall,
    flags: ItemFlags.Usable | ItemFlags.Consumable,
  });
  registerItem(Items.UltraBall, {
    name: 'Ultra Ball',
    type: ItemTypes.PokeBall,
    flags: ItemFlags.Usable | ItemFlags.Consumable,
  });
  // Never fails
  registerItem(Items.MasterBall, {
    name: 'Master Ball',
    type: ItemTypes.PokeBall,
    flags: ItemFlags.Usable | ItemFlags.Consumable,
  });
  // A commemorative Poke Ball; catches like the plain one
  registerItem(Items.PremierBall, {
    name: 'Premier Ball',
    type: ItemTypes.PokeBall,
    flags: ItemFlags.Usable | ItemFlags.Consumable,
  });
  // Heals the catch on capture
  registerItem(Items.HealBall, {
    name: 'Heal Ball',
    type: ItemTypes.PokeBall,
    flags: ItemFlags.Usable | ItemFlags.Consumable,
  });
  // Grows friendship faster
  registerItem(Items.LuxuryBall, {
    name: 'Luxury Ball',
    type: ItemTypes.PokeBall,
    flags: ItemFlags.Usable | ItemFlags.Consumable,
  });
  // Better against Bug and Water types
  registerItem(Items.NetBall, {
    name: 'Net Ball',
    type: ItemTypes.PokeBall,
    flags: ItemFlags.Usable | ItemFlags.Consumable,
  });
  // Better underwater
  registerItem(Items.DiveBall, {
    name: 'Dive Ball',
    type: ItemTypes.PokeBall,
    flags: ItemFlags.Usable | ItemFlags.Consumable,
  });
  // Better against low-level pokemon
  registerItem(Items.NestBall, {
    name: 'Nest Ball',
    type: ItemTypes.PokeBall,
    flags: ItemFlags.Usable | ItemFlags.Consumable,
  });
  // Better against species already caught
  registerItem(Items.RepeatBall, {
    name: 'Repeat Ball',
    type: ItemTypes.PokeBall,
    flags: ItemFlags.Usable | ItemFlags.Consumable,
  });
  // Grows stronger the longer the encounter runs
  registerItem(Items.TimerBall, {
    name: 'Timer Ball',
    type: ItemTypes.PokeBall,
    flags: ItemFlags.Usable | ItemFlags.Consumable,
  });
  // Strongest on the opening turn
  registerItem(Items.QuickBall, {
    name: 'Quick Ball',
    type: ItemTypes.PokeBall,
    flags: ItemFlags.Usable | ItemFlags.Consumable,
  });
  // Better at night and in caves
  registerItem(Items.DuskBall, {
    name: 'Dusk Ball',
    type: ItemTypes.PokeBall,
    flags: ItemFlags.Usable | ItemFlags.Consumable,
  });
}
