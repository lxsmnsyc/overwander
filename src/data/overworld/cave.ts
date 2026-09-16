/**
 * What the dark underground is worth, in cells.
 *
 * A cave is dark whatever the hour, because there is no sky down
 * there for an hour to come out of. That is the cost of the passage:
 * a player who goes under trades what they can see for what they can
 * reach.
 */

/**
 * How far a player sees underground carrying nothing and walking with
 * nobody who lights the way. Enough to walk by and not enough to find
 * anything with
 */
export const CAVE_DARK_CELLS = 2;

/**
 * What a light is worth down there.
 *
 * Deliberately the **same** as Illuminate's reach rather than more.
 * There are two ways to buy this and they must not turn into a ladder
 * where the answer is to carry both: a player whose buddy lights the
 * way spends nothing, a player whose buddy cannot spends their held
 * item, and the two arrive at the same place. They do not stack
 * either, for the same reason: the brighter of the two is what the
 * dark gives way to
 */
export const CAVE_LAMP_CELLS = 5;

/**
 * How far a rope looks for a way out, in chunks. The cap is really
 * for the sea, where the network runs under water that never breaks
 * the surface.
 */
export const MOUTH_SEARCH = 8;

/**
 * The least ground between two mouths, in cells.
 *
 * The hillsides offer far more doors than the world wants: left
 * alone, two thirds of the chunks cut one and a great many of them
 * stand within sight of the next. A door close enough to see from
 * another is a second way into the same stretch of cave, so the one
 * with the weaker draw is not cut at all
 */
export const MOUTH_GAP = 12;
