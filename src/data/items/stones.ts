import { ItemFlags, ItemTypes, Items } from '../ids/items';
import { registerItem } from './__create';

/**
 * The stones whose lines belong to a generation this game has not
 * registered: the item, what it is called and the picture it is drawn
 * with
 */
const LATENT_STONES: [item: Items, name: string, icon: string][] = [
  [Items.ShinyStone, 'Shiny Stone', 'shiny-stone'],
  [Items.DuskStone, 'Dusk Stone', 'dusk-stone'],
  [Items.DawnStone, 'Dawn Stone', 'dawn-stone'],
  [Items.IceStone, 'Ice Stone', 'ice-stone'],
];

/**
 * Evolution stones: used on a pokemon to trigger a UsedItem
 * evolution.
 *
 * The five Kanto stones and the Sun Stone are stocked and found; the
 * four below them are neither yet. Every line that asks for a Shiny
 * Stone or an Ice Stone belongs to a generation this game has not
 * registered, so a vendor selling one would be selling a stone with
 * nothing to spend it on. They are registered anyway, since a name, a
 * picture and a price are what an item is, and the day a line asks
 * for one the only change needed is a line in the pool
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
  for (const [item, name, icon] of LATENT_STONES) {
    registerItem(item, {
      name,
      description: 'Evolves the pokemon it is used on, where a line asks for it.',
      type: ItemTypes.Evolution,
      icon: `evolutions/${icon}`,
      flags: ItemFlags.Usable,
      buy: 0,
      sell: 0,
    });
  }
}
