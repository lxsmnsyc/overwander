import type { Moves } from '../data/ids/moves';

/**
 * Why a move was not learned.
 *
 * Teaching is refused for several unrelated reasons and they used to
 * come back as one null, so the dialog could only list all of them and
 * let the player guess which applied. Naming the reason is what turns
 * "it may know it already, be unable to learn it, be locked, or what
 * it costs may not be in your bag" into one sentence that is true.
 *
 * It is the server's answer rather than the client's guess: every one
 * of these is decided against the stored record.
 */
export const enum LearnRefusal {
  /**
   * No such catch, not this player's, still an egg, put away, or
   * fighting. They are one reason because they are one answer: the
   * record is not one that may be written right now
   */
  Unavailable = 0,
  /** The species does not learn it by the route that was asked */
  NotLearnable = 1,
  /** It knows the move already */
  Known = 2,
  /** The list is full and nothing it could forget was named */
  NoRoom = 3,
  /** What the teaching costs is not in the bag */
  Unpaid = 4,
  /** Nobody is standing there any more: the window turned over */
  Gone = 5,
  /** The tutor teaches his signature moves only at the most friendship */
  Unfriendly = 6,
}

/** What a teaching came to: the new list, or why there is not one */
export type LearnResult = { moves: Moves[] } | { refused: LearnRefusal };

/**
 * Whether a value is a refusal rather than something that landed.
 * Asked of anything a wanderer answers with, since a refusal is not a
 * visit and the counters must not take one for one
 */
export function isRefusal(value: unknown): boolean {
  return typeof value === 'object' && value !== null && 'refused' in value;
}

/** Whether the teaching landed, and the list it wrote if it did */
export function learnedMoves(result: LearnResult | null): Moves[] | null {
  return result != null && 'moves' in result ? result.moves : null;
}
