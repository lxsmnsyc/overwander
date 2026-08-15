import { ItemFlags, ItemTypes, Items } from '../ids/items';
import { registerItem } from './__create';

/**
 * The Heart Scale: what the Move Reminder is paid in.
 *
 * A move a pokemon learned by levelling and then lost is gone — the
 * four it knows are the four it knows, and a machine only ever teaches
 * a machine's move. The reminder is the one way back, and a scale is
 * the whole of his price.
 *
 * It is deliberately **worth nothing else**. No vendor stocks one, no
 * vendor takes one, and nothing holds it in a fight: a scale in the bag
 * is a forgotten move waiting to come back and cannot be turned into
 * gold on the way. That is what keeps the reminder paced by walking
 * rather than by a purse — the one wanderer whose price cannot be
 * bought.
 */

export function isHeartScale(item: Items): boolean {
  return item === Items.HeartScale;
}

export default function registerHeartScale(): void {
  registerItem(Items.HeartScale, {
    name: 'Heart Scale',
    description: 'Traded to the move reminder for a move a pokemon has forgotten.',
    type: ItemTypes.Valuable,
    // No scale of its own on the sheets; the heart is the half of it
    // a player recognises, so that is what it borrows
    icon: 'medicine/sweet-heart',
    flags: ItemFlags.Consumable,
    buy: 0,
    sell: 0,
  });
}
