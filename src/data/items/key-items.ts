import { ItemFlags, ItemTypes, Items } from '../ids/items';
import { registerItem } from './__create';

/**
 * Key items: one-of-a-kind belongings whose effect is passive. They
 * are holdable but never consumed — a key item spent would be gone
 * for good.
 */
export default function registerKeyItems(): void {
  // Held by the player's buddy, it sharpens every encounter's shiny
  // odds eightfold
  registerItem(Items.ShinyCharm, {
    name: 'Shiny Charm',
    type: ItemTypes.KeyItem,
    flags: ItemFlags.Holdable,
  });
}
