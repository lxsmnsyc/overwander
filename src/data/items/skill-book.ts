import { Slots } from '../constants/slots';
import { ItemFlags, ItemTypes, Items } from '../ids/items';
import { registerItem } from './__create';

/**
 * The Skill Book: one more move slot for one pokemon, for good. The
 * Utility Belt's shape for moves rather than items, found rather than
 * stocked for the same reason. The Dojo Master does the same for a
 * Heart Scale
 */
export const SKILL_BOOK_SLOT = Slots.Move;

export function isSkillBook(item: Items): boolean {
  return item === Items.SkillBook;
}

export default function registerSkillBook(): void {
  registerItem(Items.SkillBook, {
    name: 'Skill Book',
    description: 'Gives one pokemon a permanent extra move slot. Spent on use.',
    type: ItemTypes.Training,
    // Its own picture, tinted out of the rule book by `scripts/item-icons.ts`
    icon: 'key/skill-book',
    flags: ItemFlags.Usable | ItemFlags.Consumable,
    buy: 0,
    sell: 0,
  });
}
