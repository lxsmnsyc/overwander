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
    icon: 'balls/poke',
    flags: ItemFlags.Usable | ItemFlags.Consumable | ItemFlags.Marketable,
    buy: 200,
    sell: 100,
  });
  registerItem(Items.GreatBall, {
    name: 'Great Ball',
    type: ItemTypes.PokeBall,
    icon: 'balls/great',
    flags: ItemFlags.Usable | ItemFlags.Consumable | ItemFlags.Marketable,
    buy: 600,
    sell: 300,
  });
  registerItem(Items.UltraBall, {
    name: 'Ultra Ball',
    type: ItemTypes.PokeBall,
    icon: 'balls/ultra',
    flags: ItemFlags.Usable | ItemFlags.Consumable | ItemFlags.Marketable,
    buy: 1200,
    sell: 600,
  });
  // Never fails
  registerItem(Items.MasterBall, {
    name: 'Master Ball',
    type: ItemTypes.PokeBall,
    icon: 'balls/master',
    flags: ItemFlags.Usable | ItemFlags.Consumable,
    buy: 0,
    sell: 0,
  });
  // A commemorative Poke Ball; catches like the plain one
  registerItem(Items.PremierBall, {
    name: 'Premier Ball',
    type: ItemTypes.PokeBall,
    icon: 'balls/premier',
    flags: ItemFlags.Usable | ItemFlags.Consumable | ItemFlags.Marketable,
    buy: 200,
    sell: 100,
  });
  // Heals the catch on capture
  registerItem(Items.HealBall, {
    name: 'Heal Ball',
    type: ItemTypes.PokeBall,
    icon: 'balls/heal',
    flags: ItemFlags.Usable | ItemFlags.Consumable | ItemFlags.Marketable,
    buy: 300,
    sell: 150,
  });
  // Grows friendship faster
  registerItem(Items.LuxuryBall, {
    name: 'Luxury Ball',
    type: ItemTypes.PokeBall,
    icon: 'balls/luxury',
    flags: ItemFlags.Usable | ItemFlags.Consumable | ItemFlags.Marketable,
    buy: 1000,
    sell: 500,
  });
  // Better against Bug and Water types
  registerItem(Items.NetBall, {
    name: 'Net Ball',
    type: ItemTypes.PokeBall,
    icon: 'balls/net',
    flags: ItemFlags.Usable | ItemFlags.Consumable | ItemFlags.Marketable,
    buy: 1000,
    sell: 500,
  });
  // Better underwater
  registerItem(Items.DiveBall, {
    name: 'Dive Ball',
    type: ItemTypes.PokeBall,
    icon: 'balls/dive',
    flags: ItemFlags.Usable | ItemFlags.Consumable | ItemFlags.Marketable,
    buy: 1000,
    sell: 500,
  });
  // Better against low-level pokemon
  registerItem(Items.NestBall, {
    name: 'Nest Ball',
    type: ItemTypes.PokeBall,
    icon: 'balls/nest',
    flags: ItemFlags.Usable | ItemFlags.Consumable | ItemFlags.Marketable,
    buy: 1000,
    sell: 500,
  });
  // Better against species already caught
  registerItem(Items.RepeatBall, {
    name: 'Repeat Ball',
    type: ItemTypes.PokeBall,
    icon: 'balls/repeat',
    flags: ItemFlags.Usable | ItemFlags.Consumable | ItemFlags.Marketable,
    buy: 1000,
    sell: 500,
  });
  // Grows stronger the longer the encounter runs
  registerItem(Items.TimerBall, {
    name: 'Timer Ball',
    type: ItemTypes.PokeBall,
    icon: 'balls/timer',
    flags: ItemFlags.Usable | ItemFlags.Consumable | ItemFlags.Marketable,
    buy: 1000,
    sell: 500,
  });
  // Strongest on the opening turn
  registerItem(Items.QuickBall, {
    name: 'Quick Ball',
    type: ItemTypes.PokeBall,
    icon: 'balls/quick',
    flags: ItemFlags.Usable | ItemFlags.Consumable | ItemFlags.Marketable,
    buy: 1000,
    sell: 500,
  });
  // Better at night and in caves
  registerItem(Items.DuskBall, {
    name: 'Dusk Ball',
    type: ItemTypes.PokeBall,
    icon: 'balls/dusk',
    flags: ItemFlags.Usable | ItemFlags.Consumable | ItemFlags.Marketable,
    buy: 1000,
    sell: 500,
  });
}
