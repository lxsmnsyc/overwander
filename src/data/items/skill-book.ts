import { Slots } from '../constants/slots';
import { Items } from '../ids/items';

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
