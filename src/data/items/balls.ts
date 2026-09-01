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
    description: 'The plain ball. No help and no hindrance.',
    icon: 'balls/poke',
    flags: ItemFlags.Usable | ItemFlags.Consumable | ItemFlags.Marketable,
    buy: 200,
    sell: 100,
  });
  registerItem(Items.GreatBall, {
    name: 'Great Ball',
    type: ItemTypes.PokeBall,
    description: 'A 1.5x better chance than a plain ball.',
    icon: 'balls/great',
    flags: ItemFlags.Usable | ItemFlags.Consumable | ItemFlags.Marketable,
    buy: 600,
    sell: 300,
  });
  registerItem(Items.UltraBall, {
    name: 'Ultra Ball',
    type: ItemTypes.PokeBall,
    description: 'Twice a plain ball’s chance.',
    icon: 'balls/ultra',
    flags: ItemFlags.Usable | ItemFlags.Consumable | ItemFlags.Marketable,
    buy: 1200,
    sell: 600,
  });
  // Never fails
  registerItem(Items.MasterBall, {
    name: 'Master Ball',
    type: ItemTypes.PokeBall,
    description: 'Never fails.',
    icon: 'balls/master',
    flags: ItemFlags.Usable | ItemFlags.Consumable,
    buy: 0,
    sell: 0,
  });
  // A commemorative Poke Ball; catches like the plain one
  registerItem(Items.PremierBall, {
    name: 'Premier Ball',
    type: ItemTypes.PokeBall,
    description: 'Catches like a plain ball. A keepsake.',
    icon: 'balls/premier',
    flags: ItemFlags.Usable | ItemFlags.Consumable | ItemFlags.Marketable,
    buy: 200,
    sell: 100,
  });
  // Heals the catch on capture
  registerItem(Items.HealBall, {
    name: 'Heal Ball',
    type: ItemTypes.PokeBall,
    description: 'Catches like a plain ball, and the catch arrives whole.',
    icon: 'balls/heal',
    flags: ItemFlags.Usable | ItemFlags.Consumable | ItemFlags.Marketable,
    buy: 300,
    sell: 150,
  });
  // Grows friendship faster
  registerItem(Items.LuxuryBall, {
    name: 'Luxury Ball',
    type: ItemTypes.PokeBall,
    description: 'Catches like a plain ball. Whatever it holds warms to you 2x as fast, for life.',
    icon: 'balls/luxury',
    flags: ItemFlags.Usable | ItemFlags.Consumable | ItemFlags.Marketable,
    buy: 1000,
    sell: 500,
  });
  // Better against Bug and Water types
  registerItem(Items.NetBall, {
    name: 'Net Ball',
    type: ItemTypes.PokeBall,
    description: '3.5x against Bug and Water types.',
    icon: 'balls/net',
    flags: ItemFlags.Usable | ItemFlags.Consumable | ItemFlags.Marketable,
    buy: 1000,
    sell: 500,
  });
  // Better underwater
  registerItem(Items.DiveBall, {
    name: 'Dive Ball',
    type: ItemTypes.PokeBall,
    description: '3.5x on water.',
    icon: 'balls/dive',
    flags: ItemFlags.Usable | ItemFlags.Consumable | ItemFlags.Marketable,
    buy: 1000,
    sell: 500,
  });
  // Better against low-level pokemon
  registerItem(Items.NestBall, {
    name: 'Nest Ball',
    type: ItemTypes.PokeBall,
    description: 'Up to 4x against a low-level encounter, fading as the level rises.',
    icon: 'balls/nest',
    flags: ItemFlags.Usable | ItemFlags.Consumable | ItemFlags.Marketable,
    buy: 1000,
    sell: 500,
  });
  // Better against species already caught
  registerItem(Items.RepeatBall, {
    name: 'Repeat Ball',
    type: ItemTypes.PokeBall,
    description: '3.5x against a species you already own.',
    icon: 'balls/repeat',
    flags: ItemFlags.Usable | ItemFlags.Consumable | ItemFlags.Marketable,
    buy: 1000,
    sell: 500,
  });
  // Grows stronger the longer the encounter runs
  registerItem(Items.TimerBall, {
    name: 'Timer Ball',
    type: ItemTypes.PokeBall,
    description: 'Grows every turn the encounter runs, up to 4x.',
    icon: 'balls/timer',
    flags: ItemFlags.Usable | ItemFlags.Consumable | ItemFlags.Marketable,
    buy: 1000,
    sell: 500,
  });
  // Strongest on the opening turn
  registerItem(Items.QuickBall, {
    name: 'Quick Ball',
    type: ItemTypes.PokeBall,
    description: '5x on the opening turn, plain afterwards.',
    icon: 'balls/quick',
    flags: ItemFlags.Usable | ItemFlags.Consumable | ItemFlags.Marketable,
    buy: 1000,
    sell: 500,
  });
  // Kurt's seven. Nothing sells them, so they carry no price and no
  // Marketable flag: they are turned out of apricorns, and an
  // apricorn is picked rather than bought
  // Better the further the buddy is above what it is thrown at
  registerItem(Items.LevelBall, {
    name: 'Level Ball',
    type: ItemTypes.PokeBall,
    description: 'Up to 8x on something far below the buddy walking beside you.',
    icon: 'balls/level',
    flags: ItemFlags.Usable | ItemFlags.Consumable,
    buy: 0,
    sell: 0,
  });
  // Better on whatever a ripple brought up
  registerItem(Items.LureBall, {
    name: 'Lure Ball',
    type: ItemTypes.PokeBall,
    description: '5x on something startled out of rippling water.',
    icon: 'balls/lure',
    flags: ItemFlags.Usable | ItemFlags.Consumable,
    buy: 0,
    sell: 0,
  });
  // Better on the line a Moon Stone answers
  registerItem(Items.MoonBall, {
    name: 'Moon Ball',
    type: ItemTypes.PokeBall,
    description: '4x on a species a Moon Stone evolves.',
    icon: 'balls/moon',
    flags: ItemFlags.Usable | ItemFlags.Consumable,
    buy: 0,
    sell: 0,
  });
  // Catches no better, and what it catches arrives already fond
  registerItem(Items.FriendBall, {
    name: 'Friend Ball',
    type: ItemTypes.PokeBall,
    description: 'Catches like a Poke Ball; what it holds arrives at 200 friendship.',
    icon: 'balls/friend',
    flags: ItemFlags.Usable | ItemFlags.Consumable,
    buy: 0,
    sell: 0,
  });
  // Better on the buddy's own species, the other way round
  registerItem(Items.LoveBall, {
    name: 'Love Ball',
    type: ItemTypes.PokeBall,
    description: "8x on the buddy's own species of the opposite gender.",
    icon: 'balls/love',
    flags: ItemFlags.Usable | ItemFlags.Consumable,
    buy: 0,
    sell: 0,
  });
  // Better the heavier the thing it is thrown at
  registerItem(Items.HeavyBall, {
    name: 'Heavy Ball',
    type: ItemTypes.PokeBall,
    description: 'Up to 4x by weight, from 2x at 100 kg.',
    icon: 'balls/heavy',
    flags: ItemFlags.Usable | ItemFlags.Consumable,
    buy: 0,
    sell: 0,
  });
  // Better on whatever would outrun it
  registerItem(Items.FastBall, {
    name: 'Fast Ball',
    type: ItemTypes.PokeBall,
    description: '4x on a species with 100 base Speed or more.',
    icon: 'balls/fast',
    flags: ItemFlags.Usable | ItemFlags.Consumable,
    buy: 0,
    sell: 0,
  });
  // Better at night and in caves
  registerItem(Items.DuskBall, {
    name: 'Dusk Ball',
    type: ItemTypes.PokeBall,
    description: '3x in the evening and at night.',
    icon: 'balls/dusk',
    flags: ItemFlags.Usable | ItemFlags.Consumable | ItemFlags.Marketable,
    buy: 1000,
    sell: 500,
  });
}
