import { CAVE_LAMP_CELLS } from '../overworld/cave';
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
  // Found, never stocked, and never worth parting with
  registerItem(Items.ShinyCharm, {
    name: 'Shiny Charm',
    description: 'Eight times the odds of a shiny, while your buddy carries it.',
    type: ItemTypes.KeyItem,
    icon: 'key/shiny-charm',
    flags: ItemFlags.Holdable,
    buy: 0,
    sell: 0,
  });

  // Held by the player's buddy, it puts half again on every throw
  // whatever the ball and whatever it is thrown at
  // Carried by the buddy, it is what a player sees by underground.
  // It does not stack with a buddy that lights the way itself: the
  // brighter of the two is what the dark gives way to
  registerItem(Items.ExplorerKit, {
    name: 'Explorer Kit',
    description: `See ${CAVE_LAMP_CELLS} cells in the dark underground, while your buddy carries it.`,
    type: ItemTypes.KeyItem,
    icon: 'key/explorer-kit',
    flags: ItemFlags.Holdable,
    buy: 0,
    sell: 0,
  });

  registerItem(Items.CatchingCharm, {
    name: 'Catching Charm',
    description: 'Half again on every catch chance, while your buddy carries it.',
    type: ItemTypes.KeyItem,
    icon: 'key/catching-charm',
    flags: ItemFlags.Holdable,
    buy: 0,
    sell: 0,
  });
}
