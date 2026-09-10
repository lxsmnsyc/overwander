import { ItemFlags, ItemTypes, Items } from '../ids/items';
import { registerItem } from './__create';

/**
 * The four Sinnoh stones. Every one of them is asked for now, so they
 * are stocked and found beside the older six rather than registered
 * and left where nobody can reach them
 */
const SINNOH_STONES: [item: Items, name: string, icon: string][] = [
  [Items.ShinyStone, 'Shiny Stone', 'shiny-stone'],
  [Items.DuskStone, 'Dusk Stone', 'dusk-stone'],
  [Items.DawnStone, 'Dawn Stone', 'dawn-stone'],
  [Items.IceStone, 'Ice Stone', 'ice-stone'],
];

/**
 * Evolution stones: used on a pokemon to trigger a UsedItem
 * evolution.
 *
 * All ten are stocked and found. The four Sinnoh ones were registered
 * and left out of the market while nothing asked for them; a Roserade,
 * a Togekiss, a Mismagius, a Honchkrow, a Gallade, a Froslass, a
 * Magnezone and a Glaceon all ask now
 */
export default function registerEvolutionStones(): void {
  registerItem(Items.FireStone, {
    name: 'Fire Stone',
    description: 'Evolves the pokemon it is used on, where a line asks for it.',
    type: ItemTypes.Evolution,
    icon: 'evolutions/fire-stone',
    flags: ItemFlags.Usable | ItemFlags.Marketable,
    buy: 3000,
    sell: 1500,
  });
  registerItem(Items.WaterStone, {
    name: 'Water Stone',
    description: 'Evolves the pokemon it is used on, where a line asks for it.',
    type: ItemTypes.Evolution,
    icon: 'evolutions/water-stone',
    flags: ItemFlags.Usable | ItemFlags.Marketable,
    buy: 3000,
    sell: 1500,
  });
  registerItem(Items.ThunderStone, {
    name: 'Thunder Stone',
    description: 'Evolves the pokemon it is used on, where a line asks for it.',
    type: ItemTypes.Evolution,
    icon: 'evolutions/thunder-stone',
    flags: ItemFlags.Usable | ItemFlags.Marketable,
    buy: 3000,
    sell: 1500,
  });
  registerItem(Items.LeafStone, {
    name: 'Leaf Stone',
    description: 'Evolves the pokemon it is used on, where a line asks for it.',
    type: ItemTypes.Evolution,
    icon: 'evolutions/leaf-stone',
    flags: ItemFlags.Usable | ItemFlags.Marketable,
    buy: 3000,
    sell: 1500,
  });
  registerItem(Items.MoonStone, {
    name: 'Moon Stone',
    description: 'Evolves the pokemon it is used on, where a line asks for it.',
    type: ItemTypes.Evolution,
    icon: 'evolutions/moon-stone',
    flags: ItemFlags.Usable | ItemFlags.Marketable,
    buy: 3000,
    sell: 1500,
  });
  // Johto's own: a Sunkern becomes a Sunflora with it, so it is
  // stocked and buried like the five above rather than waiting with
  // the stones nothing can spend
  registerItem(Items.SunStone, {
    name: 'Sun Stone',
    description: 'Evolves the pokemon it is used on, where a line asks for it.',
    type: ItemTypes.Evolution,
    icon: 'evolutions/sun-stone',
    flags: ItemFlags.Usable | ItemFlags.Marketable,
    buy: 3000,
    sell: 1500,
  });

  // The stones nothing can spend yet: no market listing and no price,
  // since a price is what the market charges and the market does not
  // stock them. Both come back the day a line asks for one
  for (const [item, name, icon] of SINNOH_STONES) {
    registerItem(item, {
      name,
      description: 'Evolves the pokemon it is used on, where a line asks for it.',
      type: ItemTypes.Evolution,
      icon: `evolutions/${icon}`,
      flags: ItemFlags.Usable | ItemFlags.Marketable,
      buy: 3000,
      sell: 1500,
    });
  }
}
