import 'server-only';
import { Items } from '../data/ids/items';
import { SKILL_BOOK_SLOT } from '../data/items/skill-book';
import widenSlot from './slot-items';

/**
 * Widen one of the player's catches by a move slot, spending a Skill
 * Book. Resolves the move slots it now has, or null when refused, see
 * `widenSlot`
 */
export default async function useSkillBook(uid: string, catchId: string): Promise<number | null> {
  return widenSlot(uid, catchId, Items.SkillBook, SKILL_BOOK_SLOT);
}
